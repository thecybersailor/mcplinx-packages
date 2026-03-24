import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLinktoolCoreContext } from '../core/types.js';
import { runTestConfig } from '../core/test-config.js';

vi.mock('../lib/connector-loader.js', () => ({
    loadConnector: vi.fn(),
}));

import { loadConnector } from '../lib/connector-loader.js';

function createTempDir(prefix: string): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('linktool core test config runner', () => {
    let cwd: string;

    beforeEach(() => {
        cwd = createTempDir('linktool-core-config-');
    });

    afterEach(() => {
        fs.rmSync(cwd, { recursive: true, force: true });
        vi.resetAllMocks();
    });

    it('uses injected cwd and persists tool config into injected project data dir', async () => {
        (loadConnector as any).mockResolvedValue({
            tools: {
                search: {
                    key: 'search',
                    name: 'Search',
                    inputFields: [
                        {
                            key: 'query',
                            label: 'Query',
                            required: true,
                        },
                    ],
                },
            },
        });

        await runTestConfig(
            createLinktoolCoreContext({
                cwd,
                projectDataDirName: '.syntool',
                logger: {
                    log: vi.fn(),
                    error: vi.fn(),
                    warn: vi.fn(),
                },
            }),
            'search',
            {
                prompt: vi.fn(async () => ({ query: 'botworks' })),
            },
        );

        expect(loadConnector).toHaveBeenCalledWith(cwd);
        const saved = JSON.parse(fs.readFileSync(path.join(cwd, '.syntool', 'config.json'), 'utf8'));
        expect(saved.search.query).toBe('botworks');
    });
});
