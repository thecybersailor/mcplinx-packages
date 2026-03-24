import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

export type AsyncRunResult = {
    mode: 'async-webhook' | 'async-polling';
    initialResult: unknown;
    finalResult: unknown;
    inputData: Record<string, unknown>;
};

export type AsyncTestRunDeps = {
    createTunnelSession?: (
        ctx: LinktoolCoreContext,
        input: { toolKey: string; packageName: string },
    ) => Promise<{
        tunnel: {
            connect: () => Promise<void>;
            close: () => void | Promise<void>;
            setRequestHandler: (handler: (payload: any) => Promise<unknown>) => void;
        };
        webhookUrl: string;
    }>;
    delay?: (ms: number) => Promise<void>;
};

export async function runTestRun(
    ctx: LinktoolCoreContext,
    toolKey: string,
    options: TestRunOptions = {},
    deps: AsyncTestRunDeps = {},
): Promise<SyncRunResult | AsyncRunResult> {
    const logger = ctx.logger ?? console;
    const storage = new LinktoolStorage(ctx.cwd, ctx.projectDataDirName);
    const connector = await loadConnector(ctx.cwd);

    const tool = connector.tools?.[toolKey];
    if (!tool) {
        throw new Error(`Tool '${toolKey}' not found in connector.`);
    }

    if (tool.kind === 'async') {
        return runAsyncTestRun(ctx, toolKey, options, deps);
    }

    logger.log(`🔌 Tool: ${tool.name} (${toolKey})`);

    const authData = storage.loadAuth() || {};
    if (!storage.hasAuth() && connector.authentication) {
        logger.warn?.('⚠ No auth found. Run `npx syntool auth` first.');
    }

    let inputData: Record<string, unknown> = {};
    const savedConfig = storage.loadToolConfig(toolKey);
    if (savedConfig) {
        logger.log('Loading config from .syntool/config.json');
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

export async function runAsyncTestRun(
    ctx: LinktoolCoreContext,
    toolKey: string,
    options: TestRunOptions = {},
    deps: AsyncTestRunDeps = {},
): Promise<AsyncRunResult> {
    const logger = ctx.logger ?? console;
    const storage = new LinktoolStorage(ctx.cwd, ctx.projectDataDirName);
    const connector = await loadConnector(ctx.cwd);

    const tool = connector.tools?.[toolKey];
    if (!tool) {
        throw new Error(`Tool '${toolKey}' not found in connector.`);
    }
    if (tool.kind !== 'async') {
        throw new Error(`Tool '${toolKey}' is not async.`);
    }

    const authData = storage.loadAuth() || {};
    let inputData: Record<string, unknown> = {};
    const savedConfig = storage.loadToolConfig(toolKey);
    if (savedConfig) {
        inputData = savedConfig;
    }
    if (options.params && Object.keys(options.params).length > 0) {
        inputData = { ...inputData, ...options.params };
    }

    const packageName = readPackageName(ctx.cwd);
    const isWebhookMode = typeof tool.webhookHandler === 'function';
    const isPollingMode = typeof tool.checkStatus === 'function' && !isWebhookMode;

    let tunnelSession: Awaited<ReturnType<NonNullable<AsyncTestRunDeps['createTunnelSession']>>> | null = null;
    if (isWebhookMode) {
        if (!deps.createTunnelSession) {
            throw new Error('Missing tunnel session factory');
        }
        tunnelSession = await deps.createTunnelSession(ctx, { toolKey, packageName });
        await tunnelSession.tunnel.connect();
    }

    const bundle = buildBundle(ctx.cwd, {
        authData,
        inputData,
        targetUrl: tunnelSession?.webhookUrl,
        cleanedRequest: inputData,
        meta: {
            webhookUrl: tunnelSession?.webhookUrl,
        },
    });
    const zObject = createMockCtx(connector, bundle);
    const initialResult = await tool.perform(zObject, bundle);
    const initialResultRecord = (initialResult ?? {}) as Record<string, unknown>;
    logger.log(JSON.stringify(initialResult, null, 2));

    if (isWebhookMode && tunnelSession) {
        const finalResult = await new Promise<unknown>((resolve, reject) => {
            tunnelSession!.tunnel.setRequestHandler(async (payload: any) => {
                try {
                    const parsedBody = normalizeWebhookBody(payload.body);
                    const webhookBundle = {
                        rawRequest: {
                            body: parsedBody,
                            headers: payload.headers || {},
                            method: payload.method,
                            url: payload.url,
                        },
                        inputData: {},
                        cleanedRequest: typeof parsedBody === 'object' && parsedBody !== null ? parsedBody : {},
                        authData,
                        meta: bundle.meta,
                    };
                    const webhookHandler = tool.webhookHandler as ((z: any, bundle: any) => Promise<any>) | undefined;
                    if (!webhookHandler) {
                        throw new Error(`Async tool '${toolKey}' missing webhookHandler.`);
                    }
                    const webhookResult = await webhookHandler(zObject, webhookBundle);
                    logger.log(JSON.stringify(webhookResult, null, 2));
                    if (webhookResult?.status === 'completed' || webhookResult?.status === 'failed') {
                        resolve(webhookResult);
                    }
                    return null;
                } catch (error) {
                    reject(error);
                    throw error;
                } finally {
                    if (payload?.status === 'completed' || payload?.status === 'failed') {
                        await tunnelSession?.tunnel.close();
                    }
                }
            });
        });

        await tunnelSession.tunnel.close();
        return {
            mode: 'async-webhook',
            initialResult,
            finalResult,
            inputData,
        };
    }

    if (isPollingMode) {
        const delay = deps.delay ?? defaultDelay;
        const pollIntervalMs = options.pollIntervalMs ?? 60000;
        while (true) {
            await delay(pollIntervalMs);
            const taskId = String(initialResultRecord.taskId ?? '');
            if (!taskId) {
                throw new Error(`Async polling tool '${toolKey}' returned empty taskId.`);
            }
            const checkStatus = tool.checkStatus as ((z: any, bundle: any) => Promise<any>) | undefined;
            if (!checkStatus) {
                throw new Error(`Async tool '${toolKey}' missing checkStatus.`);
            }
            const statusResult = await checkStatus(zObject, {
                inputData: { taskId },
                authData,
                cleanedRequest: { taskId },
                meta: bundle.meta,
            });
            logger.log(JSON.stringify(statusResult, null, 2));
            if (statusResult?.status === 'completed' || statusResult?.status === 'failed') {
                return {
                    mode: 'async-polling',
                    initialResult,
                    finalResult: statusResult,
                    inputData,
                };
            }
        }
    }

    throw new Error(`Async tool '${toolKey}' has neither webhookHandler nor checkStatus.`);
}

function normalizeWebhookBody(body: unknown): unknown {
    if (typeof body !== 'string') {
        return body;
    }
    const content = body.trim();
    if (!content) {
        return {};
    }
    try {
        return JSON.parse(content);
    } catch {
        return body;
    }
}

function readPackageName(cwd: string): string {
    const packageJson = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as { name?: string };
    const value = String(packageJson.name ?? '').trim();
    if (!value) throw new Error('Missing package name');
    return value;
}

function defaultDelay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
