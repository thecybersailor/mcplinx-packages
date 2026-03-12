import {
    Tool,
    RuntimeContext,
    Bundle,
    AsyncResult,
    CheckBundle,
    CheckResult,
    TaskStatus
} from '@mcplinx/connector-core';

// 1️⃣ Perform function: initiate polling-based async task
const perform = async (ctx: RuntimeContext, bundle: Bundle): Promise<AsyncResult> => {
    const { type, input } = bundle.inputData;

    ctx.console.log(`Starting polling-based async task`);

    const response = await ctx.request({
        url: '/tasks/async',
        method: 'POST',
        json: {
            type: type || 'process',
            input
        }
    });

    const { taskId, statusViewUrl, statusCheckUrl } = response.data;

    return {
        taskId,
        status: 'pending',
        webhookSupported: false,
        taskInfoUrl: statusViewUrl // Use statusViewUrl for human viewing
    };
};

// 3️⃣ CheckStatus (polling): proactively poll to check status
const checkStatus = async (
    ctx: RuntimeContext,
    bundle: CheckBundle
): Promise<CheckResult> => {
    const { taskId } = bundle.inputData;

    ctx.console.log(`Checking status for task: ${taskId}`);

    // Use statusCheckUrl endpoint which advances task state
    // Note: /tasks/:taskId/check is a public endpoint
    const response = await ctx.request({
        url: `/tasks/${taskId}/check`,
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
        status,
        result: task.result,
        error: task.error
    };
};

export const asyncTool: Tool = {
    key: 'async',
    name: 'Process Data (Async Polling)',
    description: 'Asynchronously process data using polling for status checks',
    kind: 'async',

    perform,
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
