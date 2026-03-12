
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { discoverDocs } from '../lib/doc-discovery.js';
import { join } from 'path';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';

const TEST_DIR = join(process.cwd(), 'src/__tests__/temp-docs-test');

describe('DocDiscovery', () => {
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

    it('DOC-001: should discover single linked document', () => {
        const indexMd = '[Link](detail.md)';
        const detailMd = '# Detail';

        writeFileSync(join(TEST_DIR, 'index.md'), indexMd);
        writeFileSync(join(TEST_DIR, 'detail.md'), detailMd);

        const docs = discoverDocs(join(TEST_DIR, 'index.md'), TEST_DIR);
        expect(docs).toHaveLength(2);
        expect(docs).toContain(join(TEST_DIR, 'index.md'));
        expect(docs).toContain(join(TEST_DIR, 'detail.md'));
    });

    it('DOC-002: should recursively discover documents', () => {
        // index -> page1 -> page2
        writeFileSync(join(TEST_DIR, 'index.md'), '[Page 1](page1.md)');
        writeFileSync(join(TEST_DIR, 'page1.md'), '[Page 2](page2.md)');
        writeFileSync(join(TEST_DIR, 'page2.md'), '# Page 2');

        const docs = discoverDocs(join(TEST_DIR, 'index.md'), TEST_DIR);
        expect(docs).toHaveLength(3);
    });

    it('DOC-003: should ignore external links', () => {
        writeFileSync(join(TEST_DIR, 'index.md'), '[External](http://example.com/doc.md)');
        const docs = discoverDocs(join(TEST_DIR, 'index.md'), TEST_DIR);
        expect(docs).toHaveLength(1); // Only index.md
    });

    it('DOC-004: should prevent path traversal outside docs dir', () => {
        writeFileSync(join(TEST_DIR, 'index.md'), '[Secret](../secret.md)');
        // Ensure secret.md exists outside
        writeFileSync(join(process.cwd(), 'src/__tests__/secret.md'), 'secret');

        const docs = discoverDocs(join(TEST_DIR, 'index.md'), TEST_DIR);
        expect(docs).toHaveLength(1); // Should only contain index.md, rejecting traversal

        // Cleanup external file
        if (existsSync(join(process.cwd(), 'src/__tests__/secret.md'))) {
            rmSync(join(process.cwd(), 'src/__tests__/secret.md'));
        }
    });

    it('DOC-005: should handle circular references', () => {
        // index <-> page1
        writeFileSync(join(TEST_DIR, 'index.md'), '[Page 1](page1.md)');
        writeFileSync(join(TEST_DIR, 'page1.md'), '[Index](index.md)');

        const docs = discoverDocs(join(TEST_DIR, 'index.md'), TEST_DIR);
        expect(docs).toHaveLength(2); // Should terminate successfully
    });
});
