import { describe, expect, it, vi } from 'vitest';
import { createLinktoolCoreContext } from '../core/types.js';
import {
    buildDefaultOAuthRedirectUri,
    runTestAuth,
} from '../core/test-auth.js';

describe('linktool core test auth', () => {
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
});
