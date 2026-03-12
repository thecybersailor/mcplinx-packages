import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock ws to prevent real network calls.
vi.mock('ws', () => {
    class MockWebSocket {
        static last: { url: string; options: any } | null = null;
        constructor(url: string, options?: any) {
            MockWebSocket.last = { url, options };
        }
        on() {}
        close() {}
    }
    return { default: MockWebSocket };
});

// Mock credentials to control what TunnelClient reads from disk.
vi.mock('../credentials.js', () => {
    return {
        CredentialsManager: class {
            loadCredentials() {
                return (globalThis as any).__TEST_CREDS__ ?? null;
            }
            saveCredentials() {}
        }
    };
});

import { TunnelClient } from '../tunnel-client.js';

function makeToken(expSec: number) {
    const payload = Buffer.from(JSON.stringify({ exp: expSec }), 'utf8').toString('base64');
    return `x.${payload}.y`;
}

describe('TunnelClient', () => {
    beforeEach(() => {
        (globalThis as any).__TEST_CREDS__ = {
            token: makeToken(Math.floor(Date.now() / 1000) + 3600),
            refreshToken: 'refresh',
            email: 'a@example.com',
            host: 'https://api.mcplinx.com',
            appId: 'mcplinx',
        };

        vi.stubGlobal('fetch', vi.fn(async (_url: any, init: any) => {
            const headers = (init?.headers ?? {}) as Record<string, string>;
            expect(headers['X-MCPLINX-APP-ID']).toBe('mcplinx');
            return new Response(JSON.stringify({ sessionId: 'sid-1' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        (globalThis as any).__TEST_CREDS__ = undefined;
    });

    it('should send X-MCPLINX-APP-ID when creating session', async () => {
        const c = new TunnelClient({ host: 'localhost:16888', packageName: 'pkg' });
        await c.connect();
    });
});

