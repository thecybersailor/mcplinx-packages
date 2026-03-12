
import { describe, it, expect } from 'vitest';
import { chunkByHeading } from '../lib/markdown-chunker.js';

describe('MarkdownChunker', () => {
    it('CHUNK-001: should chunk by h1', () => {
        const md = `
# Heading 1
Content 1
# Heading 2
Content 2
`.trim();
        const chunks = chunkByHeading(md);
        expect(chunks).toHaveLength(2);
        expect(chunks[0].heading).toBe('Heading 1');
        expect(chunks[0].level).toBe(1);
        expect(chunks[0].content).toContain('# Heading 1');
        expect(chunks[0].content).toContain('Content 1');
        expect(chunks[1].heading).toBe('Heading 2');
    });

    it('CHUNK-002: should chunk by h2', () => {
        const md = `
## Section 1
Text
## Section 2
Text
`.trim();
        const chunks = chunkByHeading(md);
        expect(chunks).toHaveLength(2);
        expect(chunks[0].level).toBe(2);
    });

    it('CHUNK-004: should handle nested headings correctly', () => {
        const md = `
# Main Title
Intro
## Sub 1
Details
## Sub 2
More details
`.trim();
        const chunks = chunkByHeading(md);
        // Should produce 3 chunks: Main, Sub 1, Sub 2
        expect(chunks).toHaveLength(3);
        expect(chunks[0].heading).toBe('Main Title');
        expect(chunks[1].heading).toBe('Sub 1');
        expect(chunks[2].heading).toBe('Sub 2');
    });

    it('CHUNK-005: should handle content without headings', () => {
        const md = 'Just some plain text without headings.';
        const chunks = chunkByHeading(md);
        expect(chunks).toHaveLength(1);
        expect(chunks[0].heading).toBe('');
        expect(chunks[0].level).toBe(0);
        expect(chunks[0].content).toBe(md);
    });
});
