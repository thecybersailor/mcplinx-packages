import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLinktoolCoreContext } from '../core/types.js';
import { runBuild, runTools } from '../core/project.js';

vi.mock('../lib/connector-loader.js', () => ({
    loadConnector: vi.fn(),
}));

import { loadConnector } from '../lib/connector-loader.js';

describe('linktool core project runners', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('uses the injected cwd when listing tools', async () => {
        const ctx = createLinktoolCoreContext({
            cwd: '/tmp/connector',
            logger: {
                log: vi.fn(),
                error: vi.fn(),
                warn: vi.fn(),
            },
        });

        (loadConnector as any).mockResolvedValue({
            tools: {},
        });

        await runTools(ctx);

        expect(loadConnector).toHaveBeenCalledWith('/tmp/connector');
        expect(typeof runBuild).toBe('function');
    });
});
