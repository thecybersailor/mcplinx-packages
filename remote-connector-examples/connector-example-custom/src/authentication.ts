import { CustomAuthentication, RuntimeContext, Bundle } from '@mcplinx/connector-core';

export const authentication: CustomAuthentication = {
    type: 'custom',
    fields: [
        { key: 'app_id', label: 'App ID', required: true, type: 'string', helpText: 'Try: my_custom_app' },
        { key: 'app_secret', label: 'App Secret', required: true, type: 'password', helpText: 'Try: my_custom_secret' }
    ],
    test: async (ctx: RuntimeContext, bundle: Bundle) => {
        const response = await ctx.request({
            url: 'https://mock.dev.mcplinx.com/custom/me',
            method: 'GET'
        });

        if (response.status !== 200) {
            throw new Error('Authentication failed');
        }

        const userData = response.data;
        // Solution 1: Return label directly
        return {
            label: userData.username
        };
    }
    // connectionLabel removed - test() now returns label directly
};

export const beforeRequest = [
    (request: any, ctx: RuntimeContext, bundle: Bundle) => {
        if (bundle.authData.app_id && bundle.authData.app_secret) {
            request.headers = request.headers || {};
            request.headers['X-Custom-App-Id'] = bundle.authData.app_id;
            request.headers['X-Custom-Secret'] = bundle.authData.app_secret;
        }
        return request;
    }
];
