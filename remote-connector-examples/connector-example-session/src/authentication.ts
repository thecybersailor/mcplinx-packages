import { SessionAuthentication, RuntimeContext, Bundle } from '@mcplinx/connector-core';

export const authentication: SessionAuthentication = {
    type: 'session',
    fields: [
        { key: 'username', label: 'Username', required: true, type: 'string', helpText: 'Try: demo' },
        { key: 'password', label: 'Password', required: true, type: 'password', helpText: 'Try: demo123' }
    ],
    test: async (ctx: RuntimeContext, bundle: Bundle) => {
        const response = await ctx.request({
            url: 'https://mock.dev.mcplinx.com/session/login',
            method: 'POST',
            body: {
                username: bundle.authData.username,
                password: bundle.authData.password
            }
        });

        if (response.status !== 200) {
            throw new Error('Login failed: ' + response.content);
        }

        // Get user info from /me endpoint
        const token = response.data.sessionToken;
        const meResponse = await ctx.request({
            url: 'https://mock.dev.mcplinx.com/session/me',
            method: 'GET',
            headers: {
                'X-Session-Token': token
            }
        });

        const userData = meResponse.data;
        // Solution 1: Return label directly
        return {
            label: userData.username
        };
    }
    // connectionLabel removed - test() now returns label directly
};

export const beforeRequest = [
    async (request: any, ctx: RuntimeContext, bundle: Bundle) => {
        // Skip login request to avoid infinite recursion
        if (request.url.includes('/session/login')) {
            return request;
        }

        // Perform login to get session token
        const loginResponse = await ctx.request({
            url: 'https://mock.dev.mcplinx.com/session/login',
            method: 'POST',
            body: {
                username: bundle.authData.username,
                password: bundle.authData.password
            }
        });

        if (loginResponse.status === 200) {
            const token = loginResponse.data.sessionToken;
            request.headers = request.headers || {};
            request.headers['X-Session-Token'] = token;
        } else {
            throw new Error('Session login failed during request intercept');
        }

        return request;
    }
];
