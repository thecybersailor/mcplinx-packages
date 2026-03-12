
import { describe, it, expect } from 'vitest';

/**
 * Implementation of extractConfigKeys from build.ts
 * Since it wasn't exported, we duplicate it here for unit testing core logic.
 * In a real refactor, we should export it from build.ts or move to a lib file.
 */
function extractConfigKeys(code: string): { env_keys: string[], secret_keys: string[] } {
    const envKeys = [...code.matchAll(/\.vars\?\.([A-Z_][A-Z0-9_]*)/g)]
        .map(m => m[1]);
    const secretKeys = [...code.matchAll(/\.secrets\?\.([A-Z_][A-Z0-9_]*)/g)]
        .map(m => m[1]);

    return {
        env_keys: [...new Set(envKeys)].sort(),
        secret_keys: [...new Set(secretKeys)].sort()
    };
}

describe('ConfigExtraction', () => {
    it('CONFIG-001: should extract simple env keys', () => {
        const code = `
            const k = bundle.vars?.API_KEY;
            console.log(bundle.vars?.REGION);
        `;
        const result = extractConfigKeys(code);
        expect(result.env_keys).toEqual(['API_KEY', 'REGION']);
        expect(result.secret_keys).toEqual([]);
    });

    it('CONFIG-002: should extract secret keys', () => {
        const code = `
            const s = bundle.secrets?.CLIENT_SECRET;
        `;
        const result = extractConfigKeys(code);
        expect(result.env_keys).toEqual([]);
        expect(result.secret_keys).toEqual(['CLIENT_SECRET']);
    });

    it('CONFIG-003: should handle minified code', () => {
        // e.g. esbuild minifying 'bundle' to 'b'
        // But our regex relies on .vars?.KEY structure
        // If variable name changes, regex might fail if it expected 'bundle.vars'
        // The current regex matches .vars?.KEY regardless of object name
        const code = `var a=b.vars?.TEST_KEY;var c=d.secrets?.TEST_SECRET;`;
        const result = extractConfigKeys(code);
        expect(result.env_keys).toEqual(['TEST_KEY']);
        expect(result.secret_keys).toEqual(['TEST_SECRET']);
    });

    it('CONFIG-005: should deduplicate keys', () => {
        const code = `
            bundle.vars?.KEY1;
            bundle.vars?.KEY1;
            bundle.vars?.KEY2;
        `;
        const result = extractConfigKeys(code);
        expect(result.env_keys).toEqual(['KEY1', 'KEY2']);
    });
});
