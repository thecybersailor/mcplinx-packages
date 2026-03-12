import { Connector } from '@mcplinx/connector-core';
import { authentication, beforeRequest } from './authentication.js';
import { syncTransformTool } from './tools/sync_transform.js';
import { asyncWithWebhookTool } from './tools/async_with_webhook.js';
import { asyncTool } from './tools/async.js';

const connector: Connector = {
    name: 'connector-example',
    version: '1.0.0',
    description: 'Example connector for testing',
    authentication,
    beforeRequest,
    tools: {
        sync_transform: syncTransformTool,
        async_with_webhook: asyncWithWebhookTool,
        async: asyncTool
    }
};

export default connector;
