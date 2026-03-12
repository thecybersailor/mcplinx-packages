import { join } from 'path';
import { existsSync } from 'fs';
import { pathToFileURL } from 'url';
import { ConnectorDefinition } from '@mcplinx/connector-core';

// 全局标记，确保只注册一次 tsx loader
let tsxLoaderRegistered = false;

export async function loadConnector(cwd: string): Promise<ConnectorDefinition> {
    // 假设当前目录就是 connector 项目
    // 开发工具只加载源文件
    const possibleEntries = ['src/index.ts', 'index.ts'];
    let entryPoint = '';

    for (const p of possibleEntries) {
        const full = join(cwd, p);
        if (existsSync(full)) {
            entryPoint = full;
            break;
        }
    }

    if (!entryPoint) {
        throw new Error(`Entry point not found in ${cwd}. Expected src/index.ts or index.ts`);
    }

    try {
        console.log(`Loading connector from ${entryPoint}...`);

        // 如果是 TypeScript 文件，注册 tsx loader
        if (entryPoint.endsWith('.ts') && !tsxLoaderRegistered) {
            const { register } = await import('tsx/esm/api');
            register();
            tsxLoaderRegistered = true;
        }

        // 使用 file:// URL 来 import（避免 Windows 路径问题）
        const moduleUrl = pathToFileURL(entryPoint).href;
        const module = await import(moduleUrl);

        if (!module.default && !module.connector) {
            throw new Error("Connector module must have a default export or export 'connector'");
        }

        return module.default || module.connector;
    } catch (e: any) {
        throw new Error(`Failed to load connector: ${e.message}`);
    }
}
