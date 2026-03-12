import { APIKeyAuthentication, RuntimeContext, Bundle } from '@mcplinx/connector-core';

export const authentication: APIKeyAuthentication = {
    type: 'api_key',
    fields: [
        {
            key: 'api_key',
            label: 'API Key',
            required: true,
            type: 'password',
            helpText: 'Your Mock Service API Key (Try: test_api_key_12345)'
        }
    ],
    test: async (ctx: RuntimeContext, bundle: Bundle) => {
        const rawBaseUrl =
            (bundle as any)?.vars?.MOCK_BASE_URL ||
            (bundle as any)?.authData?.base_url ||
            'https://mock.dev.mcplinx.com';
        const baseUrl = String(rawBaseUrl).replace(/\/$/, '');
        const meUrl = baseUrl.endsWith('/api-key') ? `${baseUrl}/me` : `${baseUrl}/api-key/me`;

        const response = await ctx.request({
            url: meUrl,
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
        const rawBaseUrl =
            (bundle as any)?.vars?.MOCK_BASE_URL ||
            (bundle as any)?.authData?.base_url ||
            'https://mock.dev.mcplinx.com';
        const baseUrl = String(rawBaseUrl).replace(/\/$/, '');

        // Add base URL for relative paths.
        if (typeof request.url === 'string') {
            if (request.url.startsWith('/')) {
                request.url = `${baseUrl}${request.url}`;
            } else if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
                request.url = `${baseUrl}/${request.url}`;
            }
        }

        if (bundle.authData?.api_key) {
            request.headers = request.headers || {};
            request.headers['Authorization'] = `Bearer ${bundle.authData.api_key}`;
        }
        return request;
    }
];
