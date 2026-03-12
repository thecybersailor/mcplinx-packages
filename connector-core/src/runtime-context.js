"use strict";
/**
 * Unified RuntimeContext Implementation
 * Consolidates logic from connector-core, rt-lambda, and linktool
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Error = exports.RefreshAuthError = exports.ExpiredAuthError = exports.HaltedError = exports.ConnectorError = void 0;
exports.resolveTemplate = resolveTemplate;
exports.createRuntimeContext = createRuntimeContext;
// ============================================================================
// Error Classes
// ============================================================================
class ConnectorError extends Error {
    constructor(message) {
        super(message);
        this.name = 'Error';
    }
}
exports.ConnectorError = ConnectorError;
exports.Error = ConnectorError;
class HaltedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'HaltedError';
    }
}
exports.HaltedError = HaltedError;
class ExpiredAuthError extends Error {
    constructor(message = 'The authentication has expired') {
        super(message);
        this.name = 'ExpiredAuthError';
    }
}
exports.ExpiredAuthError = ExpiredAuthError;
class RefreshAuthError extends Error {
    constructor(message = 'Failed to refresh authentication') {
        super(message);
        this.name = 'RefreshAuthError';
    }
}
exports.RefreshAuthError = RefreshAuthError;
// ============================================================================
// Template Engine
// ============================================================================
/**
 * Resolve template variables in a string
 * Supports: {{bundle.authData.access_token}}, {{process.env.CLIENT_ID}}
 */
function resolveTemplate(template, context) {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const trimmedPath = path.trim();
        // Handle process.env.XXX
        if (trimmedPath.startsWith('process.env.')) {
            const envKey = trimmedPath.replace('process.env.', '');
            return process.env[envKey] || '';
        }
        // Handle nested paths (e.g., bundle.authData.access_token)
        const value = getNestedValue(context, trimmedPath);
        return value !== undefined ? String(value) : '';
    });
}
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
        return current?.[key];
    }, obj);
}
// ============================================================================
// HTTP Client
// ============================================================================
/**
 * Default HTTP client implementation using fetch
 */
async function defaultHttpClient(options, signal) {
    const { url, method = 'GET', headers = {}, params, body, form, json } = options;
    // Build URL with query params
    const requestUrl = new URL(url);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            requestUrl.searchParams.set(key, String(value));
        });
    }
    // Build headers
    const requestHeaders = { ...headers };
    // Build body
    let requestBody;
    if (json !== undefined) {
        requestHeaders['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(json);
    }
    else if (form) {
        requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
        requestBody = new URLSearchParams(form).toString();
    }
    else if (body) {
        if (typeof body === 'string') {
            requestBody = body;
        }
        else if (body instanceof URLSearchParams) {
            requestBody = body.toString();
        }
        else {
            requestHeaders['Content-Type'] = 'application/json';
            requestBody = JSON.stringify(body);
        }
    }
    // Execute request
    const fetchResponse = await fetch(requestUrl.toString(), {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal,
    });
    // Read response
    const content = await fetchResponse.text();
    let data;
    try {
        data = JSON.parse(content);
    }
    catch {
        data = content;
    }
    // Build response object
    const response = {
        status: fetchResponse.status,
        headers: Object.fromEntries(fetchResponse.headers.entries()),
        content,
        data,
        request: options,
        throwForStatus() {
            if (fetchResponse.status >= 400) {
                throw new Error(`HTTP ${fetchResponse.status}: ${content}`);
            }
        },
        getHeader(name) {
            return fetchResponse.headers.get(name) || undefined;
        },
    };
    return response;
}
// ============================================================================
// RuntimeContext Factory
// ============================================================================
/**
 * Create RuntimeContext instance
 * Unified implementation for both development (linktool) and production (rt-lambda)
 */
function createRuntimeContext(options) {
    const { bundle, connector, httpClient, timeout = 30000 } = options;
    const context = {
        async request(requestOptions) {
            // Apply beforeRequest interceptors
            let modifiedOptions = { ...requestOptions };
            if (connector?.beforeRequest && Array.isArray(connector.beforeRequest)) {
                for (const interceptor of connector.beforeRequest) {
                    try {
                        const result = await interceptor(modifiedOptions, context, bundle);
                        if (result) {
                            modifiedOptions = result;
                        }
                    }
                    catch (error) {
                        console.error('[RuntimeContext] beforeRequest interceptor error:', error);
                        throw error;
                    }
                }
            }
            // Replace template variables in URL
            if (modifiedOptions.url) {
                modifiedOptions.url = resolveTemplate(modifiedOptions.url, { bundle });
            }
            // Add timeout control
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            try {
                // Execute request
                const response = httpClient
                    ? await httpClient(modifiedOptions)
                    : await defaultHttpClient(modifiedOptions, controller.signal);
                // Apply afterResponse interceptors
                if (connector?.afterResponse && Array.isArray(connector.afterResponse)) {
                    let modifiedResponse = response;
                    for (const interceptor of connector.afterResponse) {
                        try {
                            const result = await interceptor(modifiedResponse, context, bundle);
                            if (result) {
                                modifiedResponse = result;
                            }
                        }
                        catch (error) {
                            console.error('[RuntimeContext] afterResponse interceptor error:', error);
                            throw error;
                        }
                    }
                    return modifiedResponse;
                }
                return response;
            }
            finally {
                clearTimeout(timeoutId);
            }
        },
        console: {
            log: (...args) => console.log('[ctx.console]', ...args),
            error: (...args) => console.error('[ctx.console]', ...args),
        },
        errors: {
            Error: ConnectorError,
            HaltedError,
            ExpiredAuthError,
            RefreshAuthError,
        },
        JSON: {
            parse: (text) => {
                try {
                    return JSON.parse(text);
                }
                catch (e) {
                    throw new Error(`Failed to parse JSON: ${text.substring(0, 100)}...`);
                }
            },
            stringify: (value) => JSON.stringify(value),
        },
        template: (template, context) => {
            return resolveTemplate(template, context);
        },
    };
    return context;
}
