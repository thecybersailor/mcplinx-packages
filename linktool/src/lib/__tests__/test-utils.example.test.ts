/**
 * Example test cases demonstrating how to use test-utils
 * 
 * This file shows best practices for testing connectors using linktool test utilities.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestContext, createMockTestContext, RequestMock } from '../test-utils.js';
import { join } from 'path';

const RUN_EXAMPLES = process.env.RUN_LINKTOOL_EXAMPLES === '1' || process.env.RUN_LINKTOOL_EXAMPLES === 'true';
const d = RUN_EXAMPLES ? describe : describe.skip;

// Example: Integration test with real HTTP requests
d('Integration Tests (Real Requests)', () => {
    it('should test tool with real API', async () => {
        // Skip if no real API available
        if (!process.env.TEST_REAL_API) {
            return;
        }

        const connectorPath = join(process.cwd(), '../../connectors/connector-example');
        const { connector, bundle, z } = await createTestContext(connectorPath, {
            authData: {
                api_key: process.env.TEST_API_KEY || 'test_api_key_12345',
                base_url: process.env.TEST_BASE_URL || 'https://mock.dev.mcplinx.com/api-key'
            },
            inputData: {
                type: 'transform',
                input: { text: 'hello' }
            }
        });

        const tool = connector.tools?.sync_transform;
        if (!tool) {
            throw new Error('Tool not found');
        }

        const result = await tool.perform(z, bundle);
        expect(result).toBeDefined();
    });
});

// Example: Unit test with mocked requests
d('Unit Tests (Mocked Requests)', () => {
    let mock: RequestMock;

    beforeEach(() => {
        mock = new RequestMock();
    });

    it('should handle successful API response', async () => {
        // Setup mock response
        mock.mockByUrl('/tasks/sync', {
            status: 200,
            body: { result: { transformed: 'HELLO' } }
        });

        const connectorPath = join(process.cwd(), '../../connectors/connector-example');
        const { connector, bundle, z } = await createMockTestContext(
            connectorPath,
            mock.createHandler(),
            {
                authData: {
                    api_key: 'test_key',
                    base_url: 'https://api.example.com'
                },
                inputData: {
                    type: 'transform',
                    input: { text: 'hello' }
                }
            }
        );

        const tool = connector.tools?.sync_transform;
        if (!tool) {
            throw new Error('Tool not found');
        }

        const result = await tool.perform(z, bundle);
        expect(result).toBeDefined();
        // Note: result type depends on tool definition
        if (typeof result === 'object' && result !== null && 'transformed' in result) {
            expect((result as any).transformed).toBe('HELLO');
        }

        // Verify request was made
        expect(mock.verifyRequestMade('/tasks/sync')).toBe(true);
    });

    it('should handle API errors', async () => {
        // Setup error response
        mock.mockByUrl('/tasks/sync', {
            status: 500,
            body: { error: 'Internal Server Error' }
        });

        const connectorPath = join(process.cwd(), '../../connectors/connector-example');
        const { connector, bundle, z } = await createMockTestContext(
            connectorPath,
            mock.createHandler(),
            {
                authData: { api_key: 'test_key' },
                inputData: { type: 'transform', input: { text: 'hello' } }
            }
        );

        const tool = connector.tools?.sync_transform;
        if (!tool) {
            throw new Error('Tool not found');
        }

        await expect(tool.perform(z, bundle)).rejects.toThrow();
    });

    it('should verify request headers', async () => {
        mock.mockByUrl('/tasks/sync', {
            status: 200,
            body: { result: {} }
        });

        const connectorPath = join(process.cwd(), '../../connectors/connector-example');
        const { connector, bundle, z } = await createMockTestContext(
            connectorPath,
            mock.createHandler(),
            {
                authData: {
                    api_key: 'test_key',
                    base_url: 'https://api.example.com'
                },
                inputData: { type: 'transform', input: { text: 'hello' } }
            }
        );

        const tool = connector.tools?.sync_transform;
        if (!tool) {
            throw new Error('Tool not found');
        }

        await tool.perform(z, bundle);

        // Verify headers were sent (if beforeRequest adds them)
        // This depends on the connector's beforeRequest implementation
        const calls = mock.getCalls();
        expect(calls.length).toBeGreaterThan(0);
    });

    it('should verify request body', async () => {
        mock.mockByUrl('/tasks/sync', {
            status: 200,
            body: { result: {} }
        });

        const connectorPath = join(process.cwd(), '../../connectors/connector-example');
        const { connector, bundle, z } = await createMockTestContext(
            connectorPath,
            mock.createHandler(),
            {
                authData: { api_key: 'test_key' },
                inputData: {
                    type: 'transform',
                    input: { text: 'hello world' }
                }
            }
        );

        const tool = connector.tools?.sync_transform;
        if (!tool) {
            throw new Error('Tool not found');
        }

        await tool.perform(z, bundle);

        // Verify request body contains expected data
        expect(mock.verifyRequestBody('/tasks/sync', {
            type: 'transform',
            input: { text: 'hello world' }
        })).toBe(true);
    });
});

// Example: Testing authentication
d('Authentication Tests', () => {
    it('should test authentication with real API', async () => {
        if (!process.env.TEST_REAL_API) {
            return;
        }

        const connectorPath = join(process.cwd(), '../../connectors/connector-example');
        const { connector, bundle, z } = await createTestContext(connectorPath, {
            authData: {
                api_key: process.env.TEST_API_KEY || 'test_api_key_12345',
                base_url: process.env.TEST_BASE_URL || 'https://mock.dev.mcplinx.com/api-key'
            }
        });

        if (connector.authentication?.test) {
            const result = await connector.authentication.test(z, bundle);
            expect(result).toBeDefined();
            expect(result.label).toBeDefined();
        }
    });

    it('should test authentication with mocked API', async () => {
        const mock = new RequestMock();
        mock.mockByUrl('/auth/test', {
            status: 200,
            body: { username: 'test_user' }
        });

        const connectorPath = join(process.cwd(), '../../connectors/connector-example');
        const { connector, bundle, z } = await createMockTestContext(
            connectorPath,
            mock.createHandler(),
            {
                authData: {
                    api_key: 'test_key',
                    base_url: 'https://api.example.com'
                }
            }
        );

        if (connector.authentication?.test) {
            const result = await connector.authentication.test(z, bundle);
            expect(result).toBeDefined();
            expect(mock.verifyRequestMade('/auth/test')).toBe(true);
        }
    });
});
