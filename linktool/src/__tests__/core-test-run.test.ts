import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLinktoolCoreContext } from '../core/types.js';
import { runAsyncTestRun, runTestRun } from '../core/test-run.js';

vi.mock('../lib/connector-loader.js', () => ({
    loadConnector: vi.fn(),
}));

import { loadConnector } from '../lib/connector-loader.js';

function createTempDir(prefix: string): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('linktool core test run runner', () => {
    let cwd: string;

    beforeEach(() => {
        cwd = createTempDir('linktool-core-run-');
        fs.mkdirSync(path.join(cwd, '.linktool'), { recursive: true });
        fs.writeFileSync(
            path.join(cwd, 'package.json'),
            JSON.stringify({ name: 'connector-example', version: '1.0.0' }),
            'utf8',
        );
        fs.writeFileSync(
            path.join(cwd, '.linktool', 'config.json'),
            JSON.stringify({ search: { query: 'from-config' } }),
            'utf8',
        );
        fs.writeFileSync(
            path.join(cwd, '.linktool', 'connection.json'),
            JSON.stringify({ name: 'conn', authData: { api_key: 'auth_1' } }),
            'utf8',
        );
    });

    afterEach(() => {
        fs.rmSync(cwd, { recursive: true, force: true });
        vi.resetAllMocks();
    });

    it('uses injected cwd, merges saved config with params, and runs sync tool', async () => {
        const perform = vi.fn(async (_z: any, bundle: any) => ({
            echoedInput: bundle.inputData,
            echoedAuth: bundle.authData,
        }));

        (loadConnector as any).mockResolvedValue({
            authentication: { type: 'api_key' },
            tools: {
                search: {
                    key: 'search',
                    name: 'Search',
                    kind: 'sync',
                    perform,
                },
            },
        });

        const out = await runTestRun(
            createLinktoolCoreContext({
                cwd,
                projectDataDirName: '.linktool',
                logger: {
                    log: vi.fn(),
                    error: vi.fn(),
                    warn: vi.fn(),
                },
            }),
            'search',
            {
                params: { page: '2' },
            },
        );

        expect(loadConnector).toHaveBeenCalledWith(cwd);
        expect(perform).toHaveBeenCalledTimes(1);
        expect(out.mode).toBe('sync');
        expect(out.result).toEqual({
            echoedInput: { query: 'from-config', page: '2' },
            echoedAuth: { api_key: 'auth_1' },
        });
    });

    it('runs async webhook tools inside linktool core with injected tunnel session', async () => {
        const perform = vi.fn(async (_z: any, bundle: any) => ({
            status: 'pending',
            taskId: 'task_1',
            webhookUrl: bundle.meta?.webhookUrl,
        }));
        const webhookHandler = vi.fn(async (_z: any, bundle: any) => ({
            status: 'completed',
            taskId: bundle.cleanedRequest.taskId,
            output: bundle.cleanedRequest.output,
        }));
        const tunnel = {
            connect: vi.fn(async () => {}),
            close: vi.fn(),
            setRequestHandler(handler: (payload: any) => Promise<unknown>) {
                void handler({
                    url: 'https://tun.dev.example.com/opaque/connector-example/webhook',
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ taskId: 'task_1', output: { ok: true }, status: 'completed' }),
                    status: 'completed',
                });
            },
        };

        (loadConnector as any).mockResolvedValue({
            authentication: { type: 'oauth2' },
            tools: {
                async_with_webhook: {
                    key: 'async_with_webhook',
                    name: 'Async With Webhook',
                    kind: 'async',
                    perform,
                    webhookHandler,
                },
            },
        });

        const out = await runAsyncTestRun(
            createLinktoolCoreContext({ cwd, projectDataDirName: '.linktool' }),
            'async_with_webhook',
            {},
            {
                createTunnelSession: async () => ({
                    tunnel,
                    webhookUrl: 'https://tun.dev.example.com/opaque/connector-example/webhook',
                }),
            },
        );

        expect(tunnel.connect).toHaveBeenCalledTimes(1);
        expect(perform).toHaveBeenCalledTimes(1);
        expect(webhookHandler).toHaveBeenCalledTimes(1);
        expect(out.mode).toBe('async-webhook');
        expect(out.finalResult).toEqual({
            status: 'completed',
            taskId: 'task_1',
            output: { ok: true },
        });
    });

    it('runs async polling tools inside linktool core with injected delay', async () => {
        const perform = vi.fn(async () => ({
            status: 'pending',
            taskId: 'task_2',
        }));
        const checkStatus = vi
            .fn()
            .mockResolvedValueOnce({ status: 'processing', taskId: 'task_2' })
            .mockResolvedValueOnce({ status: 'completed', taskId: 'task_2', output: { ok: true } });

        (loadConnector as any).mockResolvedValue({
            authentication: { type: 'oauth2' },
            tools: {
                async_polling: {
                    key: 'async_polling',
                    name: 'Async Polling',
                    kind: 'async',
                    perform,
                    checkStatus,
                },
            },
        });

        const delay = vi.fn(async () => {});

        const out = await runAsyncTestRun(
            createLinktoolCoreContext({ cwd, projectDataDirName: '.linktool' }),
            'async_polling',
            {
                pollIntervalMs: 1000,
            },
            {
                delay,
            },
        );

        expect(perform).toHaveBeenCalledTimes(1);
        expect(checkStatus).toHaveBeenCalledTimes(2);
        expect(delay).toHaveBeenCalledWith(1000);
        expect(out.mode).toBe('async-polling');
        expect(out.finalResult).toEqual({
            status: 'completed',
            taskId: 'task_2',
            output: { ok: true },
        });
    });

    it('dispatches async tools from runTestRun instead of requiring caller-side branching', async () => {
        const perform = vi.fn(async () => ({
            status: 'pending',
            taskId: 'task_3',
        }));
        const checkStatus = vi.fn(async () => ({
            status: 'completed',
            taskId: 'task_3',
            output: { ok: true },
        }));

        (loadConnector as any).mockResolvedValue({
            authentication: { type: 'oauth2' },
            tools: {
                async_polling: {
                    key: 'async_polling',
                    name: 'Async Polling',
                    kind: 'async',
                    perform,
                    checkStatus,
                },
            },
        });

        const out = await runTestRun(
            createLinktoolCoreContext({ cwd, projectDataDirName: '.linktool' }),
            'async_polling',
            {
                pollIntervalMs: 1,
            },
            {
                delay: vi.fn(async () => {}),
            } as any,
        );

        expect(out.mode).toBe('async-polling');
    });
});
