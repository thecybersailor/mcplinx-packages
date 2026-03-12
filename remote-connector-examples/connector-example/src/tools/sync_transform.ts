import { Tool, RuntimeContext, Bundle, SyncResult } from '@mcplinx/connector-core';

const perform = async (ctx: RuntimeContext, bundle: Bundle): Promise<SyncResult> => {
    const { type, input } = bundle.inputData;

    const response = await ctx.request({
        url: '/tasks/sync',
        method: 'POST',
        json: {
            type: type || 'transform',
            input
        }
    });

    return response.data.result || response.data;
};

export const syncTransformTool: Tool = {
    key: 'sync_transform',
    name: 'Transform Data (Sync)',
    description: 'Synchronously transform input data using the mock service',
    kind: 'sync',

    perform,

    inputFields: [
        {
            key: 'type',
            label: 'Transform Type',
            type: 'string',
            required: true,
            choices: [
                { label: 'Transform (to uppercase)', value: 'transform' },
                { label: 'Calculate (sum values)', value: 'calculate' },
                { label: 'Validate', value: 'validate' }
            ],
            default: 'transform',
            helpText: 'The type of transformation to perform'
        },
        {
            key: 'input',
            label: 'Input Data',
            type: 'text',
            required: true,
            helpText: 'JSON object to transform (e.g., {"text": "hello"})'
        }
    ],

    outputFields: [
        { key: 'result', label: 'Result' }
    ],

    sample: {
        original: { text: 'hello' },
        transformed: '{"TEXT":"HELLO"}'
    }
};
