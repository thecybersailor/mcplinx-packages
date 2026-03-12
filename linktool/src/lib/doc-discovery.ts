import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';

/**
 * 从 index.md 递归发现所有被引用的 Markdown 文档
 * 
 * @param indexPath - index.md 的完整路径
 * @param docsDir - docs 目录的根路径（用于相对路径计算）
 * @returns 所有发现的文档路径数组（包括 index.md 本身）
 */
export function discoverDocs(indexPath: string, docsDir: string): string[] {
    const discovered = new Set<string>([indexPath]);
    const toProcess = [indexPath];

    while (toProcess.length > 0) {
        const currentPath = toProcess.pop()!;
        
        if (!existsSync(currentPath)) {
            continue;
        }

        const content = readFileSync(currentPath, 'utf-8');

        // 提取 Markdown 链接: [text](path)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            const link = match[2];

            // 只处理相对路径的 .md 文件
            if (link.endsWith('.md') && !link.startsWith('http') && !link.startsWith('//')) {
                // 解析相对路径
                const fullPath = resolve(dirname(currentPath), link);

                // 确保路径在 docsDir 内（安全限制）
                if (fullPath.startsWith(resolve(docsDir)) && existsSync(fullPath) && !discovered.has(fullPath)) {
                    discovered.add(fullPath);
                    toProcess.push(fullPath);
                }
            }
        }
    }

    return Array.from(discovered);
}

