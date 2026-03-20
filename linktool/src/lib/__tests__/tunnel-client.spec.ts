import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock ws to prevent real network calls.
vi.mock('ws', () => {
    class MockWebSocket {
        static last: { url: string; options: any } | null = null;
        static instance: MockWebSocket | null = null;
        private listeners = new Map<string, Function[]>();
        constructor(url: string, options?: any) {
            MockWebSocket.last = { url, options };
            MockWebSocket.instance = this;
        }
        on(event: string, handler: Function) {
            const list = this.listeners.get(event) ?? [];
            list.push(handler);
            this.listeners.set(event, list);
        }
        emit(event: string, value?: any) {
            for (const handler of this.listeners.get(event) ?? []) {
                handler(value);
            }
        }
        close() {}
        send() {}
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
        vi.useRealTimers();
        (globalThis as any).__TEST_CREDS__ = undefined;
    });

    it('should send X-MCPLINX-APP-ID when creating session', async () => {
        const c = new TunnelClient({ host: 'localhost:16888', packageName: 'pkg' });
        await c.connect();
    });

    it('supports injected credentials and opaque tunnel session body', async () => {
        const fetchMock = vi.fn(async (_url: any, init: any) => {
            const headers = (init?.headers ?? {}) as Record<string, string>;
            expect(headers.Authorization).toBe('Bearer bw-token');
            expect(headers['X-MCPLINX-APP-ID']).toBe('botworks');
            expect(init?.body).toBe(
                JSON.stringify({
                    packageName: 'pkg',
                    tunnelPrefix: 'opaque-prefix',
                    scopeKind: 'team',
                    teamId: 'team_1',
                }),
            );
            return new Response(JSON.stringify({ sessionId: 'sid-bw-1' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        const c = new TunnelClient({
            host: 'tun.dev.autostaff.cn',
            packageName: 'pkg',
            sessionBody: {
                tunnelPrefix: 'opaque-prefix',
                scopeKind: 'team',
                teamId: 'team_1',
            },
            credentialsProvider: async () => ({
                token: 'bw-token',
                email: 'bw@example.com',
                appId: 'botworks',
            }),
        });

        await c.connect();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect((globalThis as any).WebSocket?.last ?? null).toBeNull();
        const wsModule = await import('ws');
        expect((wsModule.default as any).last).toMatchObject({
            url: 'wss://tun.dev.autostaff.cn/_ws?session=sid-bw-1&token=bw-token',
            options: {
                headers: {
                    Authorization: 'Bearer bw-token',
                    'X-MCPLINX-APP-ID': 'botworks',
                },
            },
        });
    });

    it('accepts devkit-tun event payloads and rebuilds callback url with query', async () => {
        const c = new TunnelClient({
            host: 'tun.dev.autostaff.cn',
            packageName: 'pkg',
            sessionId: 'sid-bw-2',
            credentialsProvider: async () => ({
                token: 'bw-token',
                email: 'bw@example.com',
                appId: 'botworks',
            }),
        });
        const handler = vi.fn(async () => null);
        c.requestHandler = handler;

        await c.connect();

        const wsModule = await import('ws');
        (wsModule.default as any).instance.emit(
            'message',
            Buffer.from(
                JSON.stringify({
                    eventType: 'callback',
                    sessionId: 'sid-bw-2',
                    scopeKind: 'team',
                    request: {
                        method: 'GET',
                        path: '/opaque-prefix/pkg/callback',
                        query: {
                            code: 'abc123',
                            state: 'xyz',
                        },
                        headers: {},
                        body: null,
                    },
                }),
            ),
        );

        expect(handler).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'GET',
                path: '/opaque-prefix/pkg/callback',
                url: 'https://tun.dev.autostaff.cn/opaque-prefix/pkg/callback?code=abc123&state=xyz',
            }),
        );
    });

    it('reuses existing session id on reconnect instead of creating a new session', async () => {
        vi.useFakeTimers();

        const fetchMock = vi.fn(async () => {
            return new Response(JSON.stringify({ sessionId: 'sid-reconnect-1' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        const c = new TunnelClient({
            host: 'tun.dev.autostaff.cn',
            packageName: 'pkg',
            credentialsProvider: async () => ({
                token: 'bw-token',
                email: 'bw@example.com',
                appId: 'botworks',
            }),
        });

        await c.connect();
        expect(fetchMock).toHaveBeenCalledTimes(1);

        const wsModule = await import('ws');
        const firstSocket = (wsModule.default as any).instance;
        firstSocket.emit('close');

        await vi.advanceTimersByTimeAsync(3000);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect((wsModule.default as any).last).toMatchObject({
            url: 'wss://tun.dev.autostaff.cn/_ws?session=sid-reconnect-1&token=bw-token',
            options: {
                headers: {
                    Authorization: 'Bearer bw-token',
                    'X-MCPLINX-APP-ID': 'botworks',
                },
            },
        });
    });
});
