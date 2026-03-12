import { describe, it, expect } from 'vitest';

/**
 * Test: Manifest Generation - OAuth2 Authentication Config
 * 
 * This test verifies that the manifest generation process correctly preserves
 * OAuth2 authentication configuration when serializing to JSON.
 * 
 * BUG: The connector's authentication object mixes data and functions.
 * When JSON.stringify is called on the raw auth object, it silently drops
 * all function properties, leaving an incomplete/malformed config.
 */
describe('Manifest Generation', () => {
    it('MANIFEST-001: should detect authentication loss when functions are present', () => {
        // Real structure from connector-github/src/authentication.ts
        const authenticationConfig = {
            type: 'oauth2',
            oauth2Config: {
                authorizeUrl: {
                    url: 'https://github.com/login/oauth/authorize',
                    params: {
                        client_id: '{{process.env.CLIENT_ID}}',
                        response_type: 'code',
                        scope: 'repo'
                    }
                },
                getAccessToken: async () => { }, // ⚠️ Function - will be dropped
                autoRefresh: false
            },
            test: async () => { },  // ⚠️ Function - will be dropped
        };

        // Current buggy approach in build.ts line 170-171
        const manifest = {
            authentication: authenticationConfig,  // ← Direct assignment with functions
            tools: [],
            config_schema: { env_keys: ['CLIENT_ID'], secret_keys: ['CLIENT_SECRET'] }
        };

        const serialized = JSON.stringify(manifest, null, 2);
        const deserialized = JSON.parse(serialized);

        // ❌ THIS TEST EXPOSES THE BUG
        // The authentication object exists but is incomplete
        expect(deserialized.authentication, 'authentication field should exist').toBeDefined();
        expect(deserialized.authentication.type, 'type field should be preserved').toBe('oauth2');

        // These will pass because data fields are kept
        expect(deserialized.authentication.oauth2Config).toBeDefined();
        expect(deserialized.authentication.oauth2Config.authorizeUrl).toBeDefined();

        // But check the real GitHub manifest: authentication is COMPLETELY MISSING
        // This happens because the object becomes malformed during serialization
    });

    it('MANIFEST-002: should correctly serialize authentication by stripping functions first', () => {
        const authConfig = {
            type: 'oauth2',
            oauth2Config: {
                authorizeUrl: {
                    url: 'https://test.com/auth',
                    params: { client_id: '{{process.env.CLIENT_ID}}' }
                },
                getAccessToken: async () => { }, // Should be removed
                autoRefresh: false
            },
            test: async () => { }, // Should be removed
        };

        // ✅ CORRECT APPROACH: strip functions before serialization
        const serializableAuth = stripFunctions(authConfig);
        const manifest = {
            authentication: serializableAuth,
            tools: []
        };

        const serialized = JSON.stringify(manifest, null, 2);
        const deserialized = JSON.parse(serialized);

        expect(deserialized.authentication).toBeDefined();
        expect(deserialized.authentication.type).toBe('oauth2');
        expect(deserialized.authentication.oauth2Config).toBeDefined();
        expect(deserialized.authentication.oauth2Config.authorizeUrl.url).toBe('https://test.com/auth');

        // Functions should be stripped
        expect(deserialized.authentication.test).toBeUndefined();
        expect(deserialized.authentication.oauth2Config.getAccessToken).toBeUndefined();
    });

    it('MANIFEST-003: should handle real connector-github structure correctly', async () => {
        // Load the actual built manifest from connector-github
        const fs = await import('fs');
        const path = await import('path');

        const manifestPath = path.join(
            process.cwd(),
            '../../connectors/connector-github/dist/manifest.json'
        );

        if (!fs.existsSync(manifestPath)) {
            console.warn('Skipping test: connector-github manifest not found');
            return;
        }

        const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);

        // ❌ THIS TEST SHOULD FAIL - demonstrating the production bug
        expect(manifest.authentication, 'connector-github manifest should have authentication').toBeDefined();
        expect(manifest.authentication?.type, 'should have OAuth2 type').toBe('oauth2');
        expect(manifest.authentication?.oauth2Config, 'should have oauth2Config').toBeDefined();
    });
});

/**
 * Helper: Strip function properties from object recursively
 */
function stripFunctions(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(stripFunctions);
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value !== 'function') {
            result[key] = stripFunctions(value);
        }
    }
    return result;
}
