import { OAuth2Authentication, RuntimeContext, Bundle, AuthBundle } from '@mcplinx/connector-core';

export const authentication: OAuth2Authentication = {
    type: 'oauth2',
    oauth2Config: {
        authorizeUrl: {
            url: 'https://mock.dev.mcplinx.com/oauth2/authorize',
            params: {
                client_id: 'mock_client_id',
                response_type: 'code',
                scope: 'read write'
            }
        },
        getAccessToken: async (ctx: RuntimeContext, bundle: AuthBundle) => {
            const code = bundle.inputData.code;
            const redirectUri = bundle.inputData.redirect_uri;
            const clientId = process.env.CLIENT_ID || 'mock_client_id';
            const clientSecret = process.env.CLIENT_SECRET || 'mock_client_secret';

            // Direct fetch to avoid authentication headers
            const response = await fetch('https://mock.dev.mcplinx.com/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri,
                    client_id: clientId,
                    client_secret: clientSecret
                }).toString()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            return {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                token_type: data.token_type || 'Bearer',
                expires_in: data.expires_in
            };
        },
        refreshAccessToken: async (ctx: RuntimeContext, bundle: AuthBundle) => {
            const refreshToken = bundle.authData.refresh_token;
            const clientId = process.env.CLIENT_ID || 'mock_client_id';
            const clientSecret = process.env.CLIENT_SECRET || 'mock_client_secret';

            // Direct fetch to avoid authentication headers
            const response = await fetch('https://mock.dev.mcplinx.com/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: clientId,
                    client_secret: clientSecret
                }).toString()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Token refresh failed: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            return {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                token_type: data.token_type || 'Bearer',
                expires_in: data.expires_in
            };
        },
        autoRefresh: true,
        scope: 'read write'
    },
        fields: [
        {
            key: 'base_url',
            label: 'Base URL',
            required: false,
            type: 'string',
                default: 'https://mock.dev.mcplinx.com',
                helpText: 'Mock Service base URL (unified endpoints)'
        }
    ],
    test: async (ctx: RuntimeContext, bundle: Bundle) => {
        const response = await ctx.request({
            url: '/oauth2/auth/test',
            method: 'GET'
        });

        if (response.status !== 200) {
            throw new Error('Authentication failed');
        }

        return {
            label: 'Mock Service Connection'
        };
    }
};

export const beforeRequest = [
    (request: any, ctx: RuntimeContext, bundle: Bundle) => {
        const baseUrl = bundle.authData.base_url || 'https://mock.dev.mcplinx.com';

        // Add base URL if URL starts with /
        if (request.url.startsWith('/')) {
            request.url = `${baseUrl}${request.url}`;
        }
        // If URL doesn't have protocol, add base URL
        else if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
            request.url = `${baseUrl}/${request.url}`;
        }

        // Add OAuth2 access token header
        if (bundle.authData.access_token) {
            request.headers = request.headers || {};
            request.headers['Authorization'] = `Bearer ${bundle.authData.access_token}`;
        }

        return request;
    }
];
