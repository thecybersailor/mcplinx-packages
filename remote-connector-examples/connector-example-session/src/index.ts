import { Connector, RuntimeContext, Bundle } from '@mcplinx/connector-core';
import { authentication, beforeRequest } from './authentication.js';

const connector: Connector = {
    name: 'connector-example-session',
    description: 'Example Session Auth Connector',
    version: '1.0.0',
    authentication,
    beforeRequest,
    tools: {
        sync_task: {
            key: 'sync_task',
            name: 'Sync Task',
            description: 'Execute a synchronous task',
            kind: 'sync',
            inputFields: [
                { key: 'input', label: 'Input Data', type: 'string', required: true }
            ],
            perform: async (ctx: RuntimeContext, bundle: Bundle) => {
                const response = await ctx.request({
                    url: '/tasks/sync',
                    method: 'POST',
                    json: {
                        type: 'transform',
                        input: bundle.inputData.input
                    }
                });
                return response.data;
            }
        }
    }
};

export default connector;
