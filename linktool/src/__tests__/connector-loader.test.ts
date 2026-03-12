
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadConnector } from '../lib/connector-loader.js';
import { join } from 'path';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';

const TEST_DIR = join(process.cwd(), 'src/__tests__/temp-loader-test');

describe('ConnectorLoader', () => {
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
        vi.restoreAllMocks();
    });

    it('CL-001: should load valid connector with default export', async () => {
        const testDir = join(TEST_DIR, 'cl-001');
        const indexTs = `
            export default {
                name: 'test-connector',
                version: '1.0.0',
                tools: {}
            };
        `;
        mkdirSync(join(testDir, 'src'), { recursive: true });
        writeFileSync(join(testDir, 'src/index.ts'), indexTs);

        const connector = await loadConnector(testDir);
        expect(connector).toBeDefined();
        expect(connector.name).toBe('test-connector');
    });

    it('CL-002: should load valid connector with named export', async () => {
        const testDir = join(TEST_DIR, 'cl-002');
        const indexTs = `
            export const connector = {
                name: 'named-connector',
                version: '1.0.0',
                tools: {}
            };
        `;
        mkdirSync(join(testDir, 'src'), { recursive: true });
        writeFileSync(join(testDir, 'src/index.ts'), indexTs);

        const connector = await loadConnector(testDir);
        expect(connector).toBeDefined();
        expect(connector.name).toBe('named-connector');
    });

    it('CL-003: should throw error if entry point not found', async () => {
        const testDir = join(TEST_DIR, 'cl-003');
        mkdirSync(testDir, { recursive: true });
        await expect(loadConnector(testDir)).rejects.toThrow('Entry point not found');
    });

    it('CL-005: should throw error if module missing exports', async () => {
        const testDir = join(TEST_DIR, 'cl-005');
        const indexTs = `
            export const somethingElse = {};
        `;
        mkdirSync(join(testDir, 'src'), { recursive: true });
        writeFileSync(join(testDir, 'src/index.ts'), indexTs);

        await expect(loadConnector(testDir)).rejects.toThrow('Connector module must have a default export');
    });
});
