import { BasicAuthentication, RuntimeContext, Bundle } from '@mcplinx/connector-core';

export const authentication: BasicAuthentication = {
    type: 'basic',
    // fields are optional, standard username/password implied if missing, but we can list them for custom logic if needed.
    // Core definition says: fields?: InputField[]; // Username/Password are implicit if missing
    // We'll rely on implicit behavior if supported, or define defaults.
    // Let's define them explicitly to be safe and add help text.
    fields: [
        { key: 'username', label: 'Username', required: true, type: 'string', helpText: 'Try: admin' },
        { key: 'password', label: 'Password', required: true, type: 'password', helpText: 'Try: admin123' }
    ],
    test: async (ctx: RuntimeContext, bundle: Bundle) => {
        const response = await ctx.request({
            url: 'https://mock.dev.mcplinx.com/basic/me',
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
        const username = bundle.authData.username;
        const password = bundle.authData.password;
        if (username && password) {
            const credentials = `${username}:${password}`;
            const base64 = btoa(credentials);
            request.headers = request.headers || {};
            request.headers['Authorization'] = `Basic ${base64}`;
        }
        return request;
    }
];
