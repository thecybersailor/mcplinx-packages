import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('linktool cli help', () => {
    it('prints syntool help text and syntool data directories', () => {
        const output = execFileSync(
            'npx',
            ['tsx', 'src/index.ts', '--help'],
            {
                cwd: path.resolve(import.meta.dirname, '..', '..'),
                encoding: 'utf8',
            },
        );

        expect(output).toContain('Usage: syntool');
        expect(output).toContain('.syntool/docs/');
        expect(output).toContain('.syntool/examples/');
        expect(output).not.toContain('Usage: linktool');
        expect(output).not.toContain('.linktool/docs/');
    });
});
