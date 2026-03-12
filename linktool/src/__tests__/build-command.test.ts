
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildCommand } from '../commands/build.js';
import { join } from 'path';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import * as esbuild from 'esbuild';

// Mock connector loader and build-time deps
vi.mock('../lib/connector-loader.js', () => ({
    loadConnector: vi.fn()
}));

// Mock esbuild
vi.mock('esbuild', () => ({
    build: vi.fn()
}));

// Import mocked modules to set behavior
import { loadConnector } from '../lib/connector-loader.js';

const TEST_DIR = join(process.cwd(), 'src/__tests__/temp-build-test');

describe('BuildCommand', () => {
    // Save original CWD
    const originalCwd = process.cwd();

    beforeEach(() => {
        // Setup temp dir
        if (existsSync(TEST_DIR)) {
            rmSync(TEST_DIR, { recursive: true, force: true });
        }
        mkdirSync(TEST_DIR, { recursive: true });
        mkdirSync(join(TEST_DIR, 'src'), { recursive: true });

        // Create dummy source files
        writeFileSync(join(TEST_DIR, 'package.json'), JSON.stringify({ name: 'test-connector', version: '1.0.0' }));
        writeFileSync(join(TEST_DIR, 'src/index.ts'), 'export default {}');

        // Change CWD to test dir
        process.chdir(TEST_DIR);

        // Reset mocks
        vi.resetAllMocks();

        // Default esbuild mock behavior
        (esbuild.build as any).mockResolvedValue({
            errors: [],
            metafile: { outputs: { 'dist/bundle.js': { bytes: 100 } } }
        });
    });

    afterEach(() => {
        // Restore CWD
        process.chdir(originalCwd);

        // Cleanup
        if (existsSync(TEST_DIR)) {
            rmSync(TEST_DIR, { recursive: true, force: true });
        }
    });

    it('BUILD-001: should generate manifest with authentication config', async () => {
        // Mock connector with auth config
        (loadConnector as any).mockResolvedValue({
            name: 'test-connector',
            authentication: {
                type: 'oauth2',
                oauth2Config: {
                    authorizeUrl: {
                        url: 'https://test.com/auth',
                        params: { client_id: '{{process.env.CLIENT_ID}}' }
                    },
                    getAccessToken: async () => { }, // Should be stripped
                }
            },
            tools: {}
        });

        // We need to write a dummy bundle.js because the command reads it to scan for keys
        mkdirSync(join(TEST_DIR, 'dist'), { recursive: true });
        writeFileSync(join(TEST_DIR, 'dist/bundle.js'), 'const a = bundle.vars?.API_KEY;');

        // Execute build command action
        const cmd = buildCommand();
        await cmd.parseAsync(['node', 'linktool', 'build']);

        // verify manifest.json existence and content
        const manifestPath = join(TEST_DIR, 'dist/manifest.json');
        expect(existsSync(manifestPath)).toBe(true);

        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

        // Verify Auth Config Preserved
        expect(manifest.authentication).toBeDefined();
        expect(manifest.authentication.type).toBe('oauth2');
        expect(manifest.authentication.oauth2Config.authorizeUrl.url).toBe('https://test.com/auth');

        // Verify Function Stripped
        expect(manifest.authentication.oauth2Config.getAccessToken).toBeUndefined();

        // Verify Config Schema
        expect(manifest.config_schema.env_keys).toContain('API_KEY');
    });

    it('BUILD-003: should generate tools metadata', async () => {
        (loadConnector as any).mockResolvedValue({
            name: 'test-connector',
            tools: {
                search: {
                    key: 'search',
                    name: 'Search Items',
                    description: 'Find items',
                    handler: async () => { }
                }
            }
        });

        // Dummy bundle
        mkdirSync(join(TEST_DIR, 'dist'), { recursive: true });
        writeFileSync(join(TEST_DIR, 'dist/bundle.js'), '');

        const cmd = buildCommand();
        await cmd.parseAsync(['node', 'linktool', 'build']);

        const manifest = JSON.parse(readFileSync(join(TEST_DIR, 'dist/manifest.json'), 'utf-8'));
        expect(manifest.tools).toHaveLength(1);
        expect(manifest.tools[0].name).toBe('Search Items');
        expect(manifest.tools[0].key).toBe('search');
    });
});
