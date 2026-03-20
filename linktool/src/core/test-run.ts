import type { LinktoolCoreContext } from './types.js';
import { buildBundle } from '../lib/bundle-builder.js';
import { loadConnector } from '../lib/connector-loader.js';
import { createMockCtx } from '../lib/runtime.js';
import { LinktoolStorage } from '../lib/storage.js';

export type TestRunOptions = {
    params?: Record<string, string>;
    pollIntervalMs?: number;
};

export type SyncRunResult = {
    mode: 'sync';
    result: unknown;
    inputData: Record<string, unknown>;
};

export async function runTestRun(
    ctx: LinktoolCoreContext,
    toolKey: string,
    options: TestRunOptions = {},
): Promise<SyncRunResult> {
    const logger = ctx.logger ?? console;
    const storage = new LinktoolStorage(ctx.cwd);
    const connector = await loadConnector(ctx.cwd);

    const tool = connector.tools?.[toolKey];
    if (!tool) {
        throw new Error(`Tool '${toolKey}' not found in connector.`);
    }

    logger.log(`🔌 Tool: ${tool.name} (${toolKey})`);

    const authData = storage.loadAuth() || {};
    if (!storage.hasAuth() && connector.authentication) {
        logger.warn?.('⚠ No auth found. Run `npx linktool auth` first.');
    }

    let inputData: Record<string, unknown> = {};
    const savedConfig = storage.loadToolConfig(toolKey);
    if (savedConfig) {
        logger.log('Loading config from .linktool/config.json');
        inputData = savedConfig;
    }

    if (options.params && Object.keys(options.params).length > 0) {
        logger.log(`Applying parameters: ${JSON.stringify(options.params)}`);
        inputData = { ...inputData, ...options.params };
    }

    const bundle = buildBundle(ctx.cwd, {
        authData,
        inputData,
        cleanedRequest: inputData,
        meta: {},
    });

    const zObject = createMockCtx(connector, bundle);

    logger.log('Running perform...');
    logger.log(`Input: ${JSON.stringify(inputData, null, 2)}`);

    if (typeof tool.perform !== 'function') {
        throw new Error('Tool perform must be a function');
    }

    const result = await tool.perform(zObject, bundle);

    logger.log('✓ Result:');
    logger.log(JSON.stringify(result, null, 2));

    return {
        mode: 'sync',
        result,
        inputData,
    };
}
