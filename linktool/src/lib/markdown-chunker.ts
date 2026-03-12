/**
 * Markdown Chunk 结构
 */
export interface MarkdownChunk {
    heading: string;      // 标题文本（如 "核心概念"）
    level: number;        // 标题级别（1, 2, 或 3）
    content: string;      // chunk 的实际内容（包含标题行）
}

/**
 * 按 heading 拆分 Markdown 文档
 * 
 * 策略：
 * - 按 #, ##, ### 拆分
 * - 每个 section 作为一个独立的 chunk
 * - 包含 heading 行本身
 * 
 * @param markdown - Markdown 文档内容
 * @returns 拆分后的 chunks 数组
 */
export function chunkByHeading(markdown: string): MarkdownChunk[] {
    const chunks: MarkdownChunk[] = [];
    const lines = markdown.split('\n');

    let currentHeading = '';
    let currentLevel = 0;
    let currentContent: string[] = [];

    for (const line of lines) {
        // 匹配 heading: # Title, ## Title, ### Title
        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);

        if (headingMatch) {
            // 遇到新 heading，保存之前的 chunk
            if (currentContent.length > 0) {
                chunks.push({
                    heading: currentHeading,
                    level: currentLevel,
                    content: currentContent.join('\n').trim()
                });
            }

            // 开始新 chunk
            currentHeading = headingMatch[2].trim();
            currentLevel = headingMatch[1].length;
            currentContent = [line];
        } else {
            // 继续当前 chunk
            currentContent.push(line);
        }
    }

    // 保存最后一个 chunk
    if (currentContent.length > 0) {
        chunks.push({
            heading: currentHeading,
            level: currentLevel,
            content: currentContent.join('\n').trim()
        });
    }

    // 如果没有找到任何 heading，将整个文档作为一个 chunk
    if (chunks.length === 0) {
        chunks.push({
            heading: '',
            level: 0,
            content: markdown.trim()
        });
    }

    return chunks;
}

