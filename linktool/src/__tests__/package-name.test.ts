
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPackageName } from '../lib/package-name.js';
import { join } from 'path';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';

const TEST_DIR = join(process.cwd(), 'src/__tests__/temp-pkg-test');

describe('PackageName', () => {
    beforeEach(() => {
        if (existsSync(TEST_DIR)) {
            rmSync(TEST_DIR, { recursive: true, force: true });
        }
        mkdirSync(TEST_DIR, { recursive: true });
    });

    afterEach(() => {
        if (existsSync(TEST_DIR)) {
            rmSync(TEST_DIR, { recursive: true, force: true });
        }
    });

    it('PKG-001: should get name from package.json', () => {
        writeFileSync(join(TEST_DIR, 'package.json'), JSON.stringify({ name: 'my-pkg' }));
        expect(getPackageName(TEST_DIR)).toBe('my-pkg');
    });

    it('PKG-002: should handle scoped packages', () => {
        writeFileSync(join(TEST_DIR, 'package.json'), JSON.stringify({ name: '@scope/my-pkg' }));
        expect(getPackageName(TEST_DIR)).toBe('scope/my-pkg');
    });

    it('PKG-003: should fallback to directory name if package.json missing', () => {
        // Should NOT throw, but return dir name (temp-pkg-test)
        expect(getPackageName(TEST_DIR)).toBe('temp-pkg-test');
    });

    it('PKG-004: should fallback to directory name if name field missing', () => {
        writeFileSync(join(TEST_DIR, 'package.json'), JSON.stringify({}));
        expect(getPackageName(TEST_DIR)).toBe('temp-pkg-test');
    });
});
