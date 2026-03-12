/**
 * Test Utilities for Connector Testing
 * 
 * Provides helper functions to simplify connector test case implementation.
 * Supports both real HTTP requests (integration tests) and mocked requests (unit tests).
 */

import { loadConnector } from './connector-loader.js';
import { buildBundle } from './bundle-builder.js';
import { createMockCtx } from './runtime.js';
import type { 
    ConnectorDefinition,
    RuntimeContext,
    Bundle,
    RequestOptions,
    HttpResponse
} from '@mcplinx/connector-core';

/**
 * Options for creating test context
 */
export interface TestContextOptions {
    authData?: Record<string, any>;
    inputData?: Record<string, any>;
    vars?: Record<string, any>;
    secrets?: Record<string, any>;
    meta?: Record<string, any>;
}

/**
 * Test context result
 */
export interface TestContext {
    connector: ConnectorDefinition;
    bundle: Bundle;
    z: RuntimeContext;
}

/**
 * Create test context with real HTTP requests (for integration tests)
 * 
 * @param connectorPath - Path to connector directory (usually process.cwd())
 * @param options - Test context options
 * @returns Test context with connector, bundle, and runtime context
 * 
 * @example
 * ```typescript
 * const { connector, bundle, z } = await createTestContext(process.cwd(), {
 *   authData: { api_key: 'test_key' },
 *   inputData: { text: 'hello' }
 * });
 * 
 * const tool = connector.tools.sync_transform;
 * const result = await tool.perform(z, bundle);
 * ```
 */
export async function createTestContext(
    connectorPath: string,
    options: TestContextOptions = {}
): Promise<TestContext> {
    const connector = await loadConnector(connectorPath);
    const bundle = buildBundle(connectorPath, {
        authData: options.authData || {},
        inputData: options.inputData || {},
        vars: options.vars,
        secrets: options.secrets,
        meta: options.meta
    });
    
    const z = createMockCtx(connector, bundle);
    
    return { connector, bundle, z };
}

/**
 * Mock request handler function type
 */
export type MockRequestHandler = (options: RequestOptions) => Promise<HttpResponse>;

/**
 * Create test context with mocked HTTP requests (for unit tests)
 * 
 * @param connectorPath - Path to connector directory (usually process.cwd())
 * @param mockRequest - Mock request handler function
 * @param options - Test context options
 * @returns Test context with connector, bundle, and runtime context (with mocked request)
 * 
 * @example
 * ```typescript
 * const mock = new RequestMock();
 * mock.mockResponse(200, { transformed: 'HELLO' });
 * 
 * const { connector, bundle, z } = await createMockTestContext(
 *   process.cwd(),
 *   mock.createHandler(),
 *   { authData: { api_key: 'test_key' }, inputData: { text: 'hello' } }
 * );
 * 
 * const tool = connector.tools.sync_transform;
 * const result = await tool.perform(z, bundle);
 * ```
 */
export async function createMockTestContext(
    connectorPath: string,
    mockRequest: MockRequestHandler,
    options: TestContextOptions = {}
): Promise<TestContext> {
    const connector = await loadConnector(connectorPath);
    const bundle = buildBundle(connectorPath, {
        authData: options.authData || {},
        inputData: options.inputData || {},
        vars: options.vars,
        secrets: options.secrets,
        meta: options.meta
    });
    
    // Create base z object
    const zBase = createMockCtx(connector, bundle);
    
    // Apply beforeRequest interceptors to the request options before passing to mock
    const z: RuntimeContext = {
        ...zBase,
        request: async (options: RequestOptions): Promise<HttpResponse> => {
            let requestOptions = { ...options };
            
            // Apply beforeRequest interceptors if they exist
            if (connector.beforeRequest && Array.isArray(connector.beforeRequest)) {
                for (const interceptor of connector.beforeRequest) {
                    try {
                        const result = await interceptor(requestOptions, z, bundle);
                        if (result) {
                            requestOptions = result;
                        }
                    } catch (err: any) {
                        throw new Error(`beforeRequest interceptor error: ${err.message}`);
                    }
                }
            }
            
            // Call the mock request handler
            return await mockRequest(requestOptions);
        }
    };
    
    return { connector, bundle, z };
}

/**
 * Record of a made request
 */
export interface RequestCall {
    url: string;
    options: RequestOptions;
}

// Re-export types for convenience
export type { RuntimeContext, Bundle, RequestOptions, HttpResponse } from '@mcplinx/connector-core';

/**
 * Request Mock Manager
 * 
 * Provides utilities to mock HTTP requests and verify request behavior.
 * 
 * @example
 * ```typescript
 * const mock = new RequestMock();
 * 
 * // Mock a simple response
 * mock.mockResponse(200, { success: true });
 * 
 * // Mock by URL pattern
 * mock.mockByUrl('/api/users', { status: 200, body: [{ id: 1 }] });
 * 
 * // Verify requests
 * expect(mock.verifyRequestMade('/api/users')).toBe(true);
 * expect(mock.verifyHeaderSent('/api/users', 'Authorization', 'Bearer token')).toBe(true);
 * ```
 */
export class RequestMock {
    private calls: RequestCall[] = [];
    private handlers: Array<{
        pattern: string | RegExp;
        response: { status: number; body: any; headers?: Record<string, string> };
    }> = [];
    private defaultResponse?: { status: number; body: any; headers?: Record<string, string> };

    /**
     * Set a default response for all requests
     */
    mockResponse(status: number, body: any, headers: Record<string, string> = {}): void {
        this.defaultResponse = { status, body, headers };
    }

    /**
     * Set a response for requests matching a URL pattern
     */
    mockByUrl(urlPattern: string | RegExp, response: { status: number; body: any; headers?: Record<string, string> }): void {
        this.handlers.push({ pattern: urlPattern, response });
    }

    /**
     * Create a mock request handler function
     */
    createHandler(): MockRequestHandler {
        return async (options: RequestOptions): Promise<HttpResponse> => {
            const url = options.url || '';
            this.calls.push({ url, options: { ...options } });

            // Check for pattern-based handlers
            for (const handler of this.handlers) {
                const matches = typeof handler.pattern === 'string'
                    ? url.includes(handler.pattern)
                    : handler.pattern.test(url);

                if (matches) {
                    return this.createResponse(handler.response, options);
                }
            }

            // Use default response if set
            if (this.defaultResponse) {
                return this.createResponse(this.defaultResponse, options);
            }

            throw new Error(`No mock response configured for URL: ${url}`);
        };
    }

    /**
     * Create an HttpResponse from mock response config
     */
    private createResponse(
        response: { status: number; body: any; headers?: Record<string, string> },
        requestOptions: RequestOptions
    ): HttpResponse {
        const bodyText = typeof response.body === 'string'
            ? response.body
            : JSON.stringify(response.body);

        const headers = response.headers || {};

        return {
            status: response.status,
            headers,
            content: bodyText,
            data: response.body,
            request: requestOptions,
            throwForStatus: () => {
                if (response.status >= 400) {
                    throw new Error(`Response status ${response.status}`);
                }
            },
            getHeader: (name: string) => headers[name] || undefined
        } as HttpResponse;
    }

    /**
     * Verify if a request was made matching the URL pattern
     */
    verifyRequestMade(urlPattern: string | RegExp): boolean {
        return this.calls.some(call => {
            const url = call.url;
            return typeof urlPattern === 'string'
                ? url.includes(urlPattern)
                : urlPattern.test(url);
        });
    }

    /**
     * Verify if a request contains a specific header
     */
    verifyHeaderSent(
        urlPattern: string | RegExp,
        headerName: string,
        headerValue?: string
    ): boolean {
        const call = this.calls.find(c => {
            const url = c.url;
            return typeof urlPattern === 'string'
                ? url.includes(urlPattern)
                : urlPattern.test(url);
        });

        if (!call) return false;

        const headers = call.options.headers || {};
        const headerKey = Object.keys(headers).find(
            k => k.toLowerCase() === headerName.toLowerCase()
        );

        if (!headerKey) return false;

        if (headerValue !== undefined) {
            return headers[headerKey] === headerValue;
        }

        return true;
    }

    /**
     * Verify if a request body matches expected data
     */
    verifyRequestBody(
        urlPattern: string | RegExp,
        expectedBody: any
    ): boolean {
        const call = this.calls.find(c => {
            const url = c.url;
            return typeof urlPattern === 'string'
                ? url.includes(urlPattern)
                : urlPattern.test(url);
        });

        if (!call) return false;

        const actualBody = call.options.body || call.options.json;
        const expectedJson = JSON.stringify(expectedBody);
        const actualJson = typeof actualBody === 'string'
            ? actualBody
            : JSON.stringify(actualBody);

        return actualJson === expectedJson;
    }

    /**
     * Get all request calls
     */
    getCalls(): RequestCall[] {
        return [...this.calls];
    }

    /**
     * Get calls matching a URL pattern
     */
    getCallsByUrl(urlPattern: string | RegExp): RequestCall[] {
        return this.calls.filter(call => {
            const url = call.url;
            return typeof urlPattern === 'string'
                ? url.includes(urlPattern)
                : urlPattern.test(url);
        });
    }

    /**
     * Reset all mocks and call history
     */
    reset(): void {
        this.calls = [];
        this.handlers = [];
        this.defaultResponse = undefined;
    }
}

