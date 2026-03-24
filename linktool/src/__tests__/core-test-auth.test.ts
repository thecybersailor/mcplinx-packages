import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLinktoolCoreContext } from '../core/types.js';
import {
    buildDefaultOAuthRedirectUri,
    runInteractiveTestAuth,
    runTestAuth,
} from '../core/test-auth.js';

vi.mock('../lib/connector-loader.js', () => ({
    loadConnector: vi.fn(),
}));

import { loadConnector } from '../lib/connector-loader.js';

function createTempDir(prefix: string): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('linktool core test auth', () => {
    let cwd: string;

    beforeEach(() => {
        cwd = createTempDir('linktool-core-auth-');
        fs.mkdirSync(path.join(cwd, '.syntool'), { recursive: true });
    });

    afterEach(() => {
        fs.rmSync(cwd, { recursive: true, force: true });
        vi.resetAllMocks();
    });

    it('builds the legacy default oauth redirect uri from tunnel host, user hash id, and package name', () => {
        expect(buildDefaultOAuthRedirectUri('tun.dev.mcplinx.com', 'user_1', 'connector-github')).toBe(
            'https://tun.dev.mcplinx.com/user_1/connector-github/callback',
        );
    });

    it('allows injected auth context for show-url-only flow', async () => {
        const logger = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
        };

        await runTestAuth(
            createLinktoolCoreContext({
                cwd: '/tmp/connector',
                tunnelBaseUrl: 'https://tun.dev.autostaff.cn',
                logger,
            }),
            {
                cliConnectorId: undefined,
                showUrlOnly: true,
            },
            {
                ensureProject: vi.fn(),
                getPackageName: vi.fn(() => 'connector-github'),
                getAuthContext: vi.fn(() => ({
                    userHashId: 'user_hash_1',
                    tunnelBaseUrl: 'https://tun.dev.autostaff.cn',
                    callbackPath: '/opaque-prefix/connector-github/callback',
                })),
                writeStdout: vi.fn(),
            },
        );

        expect(logger.log).not.toHaveBeenCalled();
    });

    it('runs interactive oauth2 auth inside linktool core with injected tunnel session', async () => {
        const getAccessToken = vi.fn(async () => ({ access_token: 'access_1' }));
        const testAuth = vi.fn(async () => ({ label: 'Demo OAuth Account' }));
        const tunnel = {
            connect: vi.fn(async () => {}),
            close: vi.fn(),
            setRequestHandler(handler: (payload: any) => Promise<unknown>) {
                void handler({ url: 'https://tun.dev.autostaff.cn/opaque/callback?code=code_1' });
            },
        };

        (loadConnector as any).mockResolvedValue({
            authentication: {
                type: 'oauth2',
                oauth2Config: {
                    authorizeUrl: async () => 'https://mock.dev.mcplinx.com/oauth2/authorize?client_id=demo',
                    getAccessToken,
                },
                test: testAuth,
                connectionLabel: '{{label}}',
            },
        });

        const stdout = vi.fn();

        await runInteractiveTestAuth(
            createLinktoolCoreContext({ cwd, projectDataDirName: '.syntool' }),
            {
                packageName: 'connector-example',
                authContext: {
                    userHashId: 'user_hash_1',
                    tunnelBaseUrl: 'https://tun.dev.autostaff.cn',
                    callbackPath: '/opaque/connector-example/callback',
                },
            },
            {
                createTunnelSession: async () => ({
                    tunnel,
                    callbackUrl: 'https://tun.dev.autostaff.cn/opaque/connector-example/callback',
                }),
                writeStdout: stdout,
            },
        );

        expect(tunnel.connect).toHaveBeenCalledTimes(1);
        expect(getAccessToken).toHaveBeenCalledTimes(1);
        expect(testAuth).toHaveBeenCalledTimes(1);
        const saved = JSON.parse(fs.readFileSync(path.join(cwd, '.syntool', 'connection.json'), 'utf8'));
        expect(saved.authData).toEqual({ access_token: 'access_1' });
        expect(saved.name).toBe('Demo OAuth Account');
    });

    it('runs interactive form auth inside linktool core with injected prompt handler', async () => {
        const testAuth = vi.fn(async () => ({ label: 'Form Connection' }));
        (loadConnector as any).mockResolvedValue({
            authentication: {
                type: 'custom',
                fields: [
                    { key: 'app_id', label: 'App ID', required: true },
                    { key: 'app_secret', label: 'App Secret', required: true },
                ],
                test: testAuth,
                connectionLabel: '{{label}}',
            },
        });

        await runInteractiveTestAuth(
            createLinktoolCoreContext({ cwd, projectDataDirName: '.syntool' }),
            {
                packageName: 'connector-example-custom',
                authContext: {
                    userHashId: 'user_hash_1',
                },
            },
            {
                promptInput: vi
                    .fn()
                    .mockResolvedValueOnce('my_app')
                    .mockResolvedValueOnce('my_secret'),
                writeStdout: vi.fn(),
            },
        );

        expect(testAuth).toHaveBeenCalledTimes(1);
        const saved = JSON.parse(fs.readFileSync(path.join(cwd, '.syntool', 'connection.json'), 'utf8'));
        expect(saved.authData).toEqual({ app_id: 'my_app', app_secret: 'my_secret' });
        expect(saved.name).toBe('Form Connection');
    });
});
