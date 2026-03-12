/**
 * RuntimeContext Implementation
 * Provides runtime utilities for connector execution
 */

import {
    RuntimeContext,
    RequestOptions,
    HttpResponse,
    Bundle,
    RequestInterceptor,
    ResponseInterceptor,
} from './types';

// ============================================================================
// Error Classes
// ============================================================================

export class ConnectorError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Error';
    }
}

export class HaltedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'HaltedError';
    }
}

export class ExpiredAuthError extends Error {
    constructor(message: string = 'The authentication has expired') {
        super(message);
        this.name = 'ExpiredAuthError';
    }
}

export class RefreshAuthError extends Error {
    constructor(message: string = 'Failed to refresh authentication') {
        super(message);
        this.name = 'RefreshAuthError';
    }
}

// ============================================================================
// Template Engine
// ============================================================================

/**
 * Template variable substitution
 * Supports: {{bundle.authData.access_token}}, {{process.env.CLIENT_ID}}
 */
export function resolveTemplate(
    template: string,
    context: Record<string, any>
): string {
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

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
        return current?.[key];
    }, obj);
}

// ============================================================================
// HTTP Client
// ============================================================================

async function makeRequest(options: RequestOptions): Promise<HttpResponse> {
    const { url, method = 'GET', headers = {}, params, body, form, json, skipThrowForStatus } = options;

    // Build URL (add query params)
    const requestUrl = new URL(url);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            requestUrl.searchParams.set(key, String(value));
        });
    }

    // Build headers
    const requestHeaders: Record<string, string> = { ...headers };

    // Build body
    let requestBody: string | undefined;

    if (json) {
        requestHeaders['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(json);
    } else if (form) {
        requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
        requestBody = new URLSearchParams(form).toString();
    } else if (body) {
        if (typeof body === 'string') {
            requestBody = body;
        } else {
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
    let data: any;

    try {
        data = JSON.parse(content);
    } catch {
        data = content;
    }

    // Build response object
    const response: HttpResponse = {
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

        getHeader(name: string) {
            return fetchResponse.headers.get(name) || undefined;
        },
    };

    // Auto-check status code
    if (!skipThrowForStatus && fetchResponse.status >= 400) {
        response.throwForStatus();
    }

    return response;
}

// ============================================================================
// RuntimeContext Factory
// ============================================================================

export interface CreateRuntimeContextOptions {
    bundle: Bundle;
    beforeRequest?: RequestInterceptor[];
    afterResponse?: ResponseInterceptor[];
}

/**
 * Create RuntimeContext instance
 */
export function createRuntimeContext(options: CreateRuntimeContextOptions): RuntimeContext {
    const { bundle, beforeRequest = [], afterResponse = [] } = options;

    const ctx: RuntimeContext = {
        async request(requestOptions: RequestOptions): Promise<HttpResponse> {
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
            log: (...args: any[]) => console.log('[ctx.console]', ...args),
            error: (...args: any[]) => console.error('[ctx.console]', ...args),
        },

        errors: {
            Error: ConnectorError,
            HaltedError,
            ExpiredAuthError,
            RefreshAuthError,
        },

        JSON: {
            parse: (text: string) => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    throw new Error(`Failed to parse JSON: ${text.substring(0, 100)}...`);
                }
            },
            stringify: (value: any) => JSON.stringify(value),
        },

        template: (template: string, context: Record<string, any>) => {
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
export function includeBearerToken(
    request: RequestOptions,
    ctx: RuntimeContext,
    bundle: Bundle
): RequestOptions {
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
export function includeApiKeyHeader(headerName: string = 'X-API-Key') {
    return (request: RequestOptions, ctx: RuntimeContext, bundle: Bundle): RequestOptions => {
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
export function includeBasicAuth(
    request: RequestOptions,
    ctx: RuntimeContext,
    bundle: Bundle
): RequestOptions {
    if (bundle.authData.username && bundle.authData.password) {
        const credentials = Buffer.from(
            `${bundle.authData.username}:${bundle.authData.password}`
        ).toString('base64');

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
