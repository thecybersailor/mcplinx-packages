import { describe, expect, it } from 'vitest';
import {
    createHelpCommandContext,
    getDocsCommandRunner,
    getExamplesCommandRunner,
} from '../core/help.js';

describe('linktool core help runners', () => {
    it('exposes get-docs and get-examples as programmable runners', () => {
        const ctx = createHelpCommandContext({
            cwd: '/tmp/project',
        });

        expect(ctx.cwd).toBe('/tmp/project');
        expect(typeof getDocsCommandRunner).toBe('function');
        expect(typeof getExamplesCommandRunner).toBe('function');
    });

    it('preserves injected project data dir in help context', () => {
        const ctx = createHelpCommandContext({
            cwd: '/tmp/project',
            projectDataDirName: '.syntool',
        });

        expect(ctx.projectDataDirName).toBe('.syntool');
    });
});
