import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLinktoolCoreContext } from '../core/types.js';
import { runTestRun } from '../core/test-run.js';

vi.mock('../lib/connector-loader.js', () => ({
    loadConnector: vi.fn(),
}));

import { loadConnector } from '../lib/connector-loader.js';

function createTempDir(prefix: string): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('linktool core test run runner', () => {
    let cwd: string;

    beforeEach(() => {
        cwd = createTempDir('linktool-core-run-');
        fs.mkdirSync(path.join(cwd, '.linktool'), { recursive: true });
        fs.writeFileSync(
            path.join(cwd, '.linktool', 'config.json'),
            JSON.stringify({ search: { query: 'from-config' } }),
            'utf8',
        );
        fs.writeFileSync(
            path.join(cwd, '.linktool', 'connection.json'),
            JSON.stringify({ name: 'conn', authData: { api_key: 'auth_1' } }),
            'utf8',
        );
    });

    afterEach(() => {
        fs.rmSync(cwd, { recursive: true, force: true });
        vi.resetAllMocks();
    });

    it('uses injected cwd, merges saved config with params, and runs sync tool', async () => {
        const perform = vi.fn(async (_z: any, bundle: any) => ({
            echoedInput: bundle.inputData,
            echoedAuth: bundle.authData,
        }));

        (loadConnector as any).mockResolvedValue({
            authentication: { type: 'api_key' },
            tools: {
                search: {
                    key: 'search',
                    name: 'Search',
                    kind: 'sync',
                    perform,
                },
            },
        });

        const out = await runTestRun(
            createLinktoolCoreContext({
                cwd,
                logger: {
                    log: vi.fn(),
                    error: vi.fn(),
                    warn: vi.fn(),
                },
            }),
            'search',
            {
                params: { page: '2' },
            },
        );

        expect(loadConnector).toHaveBeenCalledWith(cwd);
        expect(perform).toHaveBeenCalledTimes(1);
        expect(out.mode).toBe('sync');
        expect(out.result).toEqual({
            echoedInput: { query: 'from-config', page: '2' },
            echoedAuth: { api_key: 'auth_1' },
        });
    });
});
