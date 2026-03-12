import { OAuth2Authentication, RuntimeContext, AuthBundle, Bundle } from '@mcplinx/connector-core';

export const authentication: OAuth2Authentication = {
    type: 'oauth2',
    oauth2Config: {
        authorizeUrl: {
            url: 'https://mock.dev.mcplinx.com/oauth2/authorize',
            params: {
                // client_id will be injected from env/input
                response_type: 'code'
            }
        },
        getAccessToken: async (ctx: RuntimeContext, bundle: AuthBundle) => {
            console.log('Token Exchange Input:', {
                code: bundle.inputData.code,
                redirect_uri: bundle.inputData.redirect_uri,
                client_id: bundle.vars?.CLIENT_ID
            });
            const response = await ctx.request({
                url: 'https://mock.dev.mcplinx.com/oauth2/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: bundle.inputData.code || '',
                    redirect_uri: bundle.inputData.redirect_uri || '',
                    client_id: bundle.vars?.CLIENT_ID || 'mock_client_id',
                    client_secret: bundle.secrets?.CLIENT_SECRET || 'mock_client_secret'
                }).toString()
            });

            if (response.status !== 200) {
                throw new Error(`Failed to get access token: ${response.content}`);
            }

            return response.data;
        },
        refreshAccessToken: async (ctx: RuntimeContext, bundle: AuthBundle) => {
            const response = await ctx.request({
                url: 'https://mock.dev.mcplinx.com/oauth2/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: bundle.authData.refresh_token,
                    client_id: bundle.vars?.CLIENT_ID || 'mock_client_id',
                    client_secret: bundle.secrets?.CLIENT_SECRET || 'mock_client_secret'
                }).toString()
            });

            if (response.status !== 200) {
                throw new Error(`Failed to refresh access token: ${response.content}`);
            }

            return response.data;
        },
        autoRefresh: true
    },
    test: async (ctx: RuntimeContext, bundle: Bundle) => {
        const response = await ctx.request({
            url: 'https://mock.dev.mcplinx.com/oauth2/me',
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
        if (bundle.authData.access_token) {
            request.headers = request.headers || {};
            request.headers['Authorization'] = `Bearer ${bundle.authData.access_token}`;
        }
        return request;
    }
];
