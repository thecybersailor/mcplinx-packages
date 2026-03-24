import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('linktool cli help', () => {
    it('prints linktool help text and linktool data directories', () => {
        const output = execFileSync(
            'npx',
            ['tsx', 'src/index.ts', '--help'],
            {
                cwd: path.resolve(import.meta.dirname, '..', '..'),
                encoding: 'utf8',
            },
        );

        expect(output).toContain('Usage: linktool');
        expect(output).toContain('.linktool/docs/');
        expect(output).toContain('.linktool/examples/');
    });
});
