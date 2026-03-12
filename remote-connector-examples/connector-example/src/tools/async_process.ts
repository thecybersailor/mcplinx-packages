import {
    Tool,
    RuntimeContext,
    Bundle,
    AsyncResult,
    WebhookBundle,
    WebhookResult,
    CheckBundle,
    CheckResult,
    TaskStatus
} from '@mcplinx/connector-core';

// 1️⃣ Perform function: initiate async task
const perform = async (ctx: RuntimeContext, bundle: Bundle): Promise<AsyncResult> => {
    const { type, input } = bundle.inputData;

    // 🔑 Key: get system-generated webhookUrl from meta
    const webhookUrl = bundle.meta?.webhookUrl;

    ctx.console.log(`Starting async task with webhook: ${webhookUrl}`);

    const response = await ctx.request({
        url: '/tasks/async-with-webhook',
        method: 'POST',
        json: {
            type: type || 'process',
            input,
            webhookUrl  // Pass to third-party service
        }
    });

    const { taskId, taskInfoUrl } = response.data;

    return {
        taskId,
        status: 'pending',
        webhookSupported: true,
        taskInfoUrl
    };
};

// 2️⃣ WebhookHandler: handle third-party service callbacks
const webhookHandler = async (
    ctx: RuntimeContext,
    bundle: WebhookBundle
): Promise<WebhookResult> => {
    const { body, headers, url } = bundle.rawRequest;

    // Skip internal system requests
    if (url && url.includes('internal/')) {
        return { status: 'running', taskId: '' }; // Dummy response, will be ignored
    }

    ctx.console.log('Received webhook callback:', JSON.stringify(body));

    // 🔑 Connector parses and determines status itself
    // Different services have different callback formats, handled by connector author

    let status: TaskStatus;

    // Mock Service phase-based callback format: { taskId, phase, step, message, data, output, completedAt }
    if (body.phase === 'done') {
        status = 'completed';
    } else if (body.phase === 'processing') {
        status = 'running';
    } else if (body.phase === 'error') {
        status = 'failed';
    } else {
        status = 'running'; // Default fallback
    }

    return {
        taskId: body.taskId,
        status,
        result: body.phase === 'done' ? body.output : undefined,
        error: body.phase === 'error' ? body.error : undefined
    };
};

// 3️⃣ CheckStatus (optional): proactively poll to check status
const checkStatus = async (
    ctx: RuntimeContext,
    bundle: CheckBundle
): Promise<CheckResult> => {
    const { taskId } = bundle.inputData;

    ctx.console.log(`Checking status for task: ${taskId}`);

    const response = await ctx.request({
        url: `/tasks/${taskId}`,
        method: 'GET'
    });

    const task = response.data;

    let status: TaskStatus;

    switch (task.status) {
        case 'completed':
            status = 'completed';
            break;
        case 'failed':
            status = 'failed';
            break;
        case 'pending':
        case 'running':
        default:
            status = 'running';
    }

    return {
        taskId,
        status,
        result: task.result,
        error: task.error
    };
};

export const asyncWithWebhookTool: Tool = {
    key: 'async_with_webhook',
    name: 'Process Data (Async with Webhook)',
    description: 'Asynchronously process data with automatic webhook callbacks',
    kind: 'async',

    perform,
    webhookHandler,
    checkStatus,

    inputFields: [
        {
            key: 'type',
            label: 'Processing Type',
            type: 'string',
            required: true,
            choices: [
                { label: 'Process', value: 'process' },
                { label: 'Analyze', value: 'analyze' },
                { label: 'Generate', value: 'generate' }
            ],
            default: 'process',
            helpText: 'The type of processing to perform (takes 3-8 seconds)'
        },
        {
            key: 'input',
            label: 'Input Data',
            type: 'text',
            required: true,
            helpText: 'JSON object to process (e.g., {"data": "test"})'
        }
    ],

    outputFields: [
        { key: 'taskId', label: 'Task ID' },
        { key: 'processed', label: 'Processed' },
        { key: 'output', label: 'Output' },
        { key: 'processingTimeMs', label: 'Processing Time (ms)' }
    ],

    sample: {
        taskId: 'task_1704369600000_abc123',
        processed: true,
        input: { data: 'test' },
        output: 'Processed: {"data":"test"}',
        processingTimeMs: 5234
    }
};
