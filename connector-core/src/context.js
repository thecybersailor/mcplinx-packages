"use strict";
/**
 * RuntimeContext Implementation
 * Provides runtime utilities for connector execution
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshAuthError = exports.ExpiredAuthError = exports.HaltedError = exports.ConnectorError = void 0;
exports.resolveTemplate = resolveTemplate;
exports.createRuntimeContext = createRuntimeContext;
exports.includeBearerToken = includeBearerToken;
exports.includeApiKeyHeader = includeApiKeyHeader;
exports.includeBasicAuth = includeBasicAuth;
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
 * Template variable substitution
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
async function makeRequest(options) {
    const { url, method = 'GET', headers = {}, params, body, form, json, skipThrowForStatus } = options;
    // Build URL (add query params)
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
    if (json) {
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
        else {
            requestHeaders['Content-Type'] = 'application/json';
            requestBody = JSON.stringify(body);
        }
    }
    // Send request
    const fetchResponse = await fetch(requestUrl.toString(), {
        method,
        headers: requestHeaders,
        body: requestBody,
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
    // Auto-check status code
    if (!skipThrowForStatus && fetchResponse.status >= 400) {
        response.throwForStatus();
    }
    return response;
}
/**
 * Create RuntimeContext instance
 */
function createRuntimeContext(options) {
    const { bundle, beforeRequest = [], afterResponse = [] } = options;
    const ctx = {
        async request(requestOptions) {
            // Apply before interceptors
            let modifiedOptions = { ...requestOptions };
            for (const interceptor of beforeRequest) {
                modifiedOptions = await interceptor(modifiedOptions, ctx, bundle);
            }
            // Replace template variables in URL
            modifiedOptions.url = resolveTemplate(modifiedOptions.url, { bundle });
            // Send request
            let response = await makeRequest(modifiedOptions);
            // Apply after interceptors
            for (const interceptor of afterResponse) {
                response = await interceptor(response, ctx, bundle);
            }
            return response;
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
    return ctx;
}
// ============================================================================
// Common Request Interceptors
// ============================================================================
/**
 * Bearer Token interceptor
 */
function includeBearerToken(request, ctx, bundle) {
    if (bundle.authData.access_token) {
        return {
            ...request,
            headers: {
                ...request.headers,
                Authorization: `Bearer ${bundle.authData.access_token}`,
            },
        };
    }
    return request;
}
/**
 * API Key Header interceptor
 */
function includeApiKeyHeader(headerName = 'X-API-Key') {
    return (request, ctx, bundle) => {
        if (bundle.authData.api_key) {
            return {
                ...request,
                headers: {
                    ...request.headers,
                    [headerName]: bundle.authData.api_key,
                },
            };
        }
        return request;
    };
}
/**
 * Basic Auth interceptor
 */
function includeBasicAuth(request, ctx, bundle) {
    if (bundle.authData.username && bundle.authData.password) {
        const credentials = Buffer.from(`${bundle.authData.username}:${bundle.authData.password}`).toString('base64');
        return {
            ...request,
            headers: {
                ...request.headers,
                Authorization: `Basic ${credentials}`,
            },
        };
    }
    return request;
}
