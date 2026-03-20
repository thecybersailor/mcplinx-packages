import type { LinktoolCoreContext } from './types.js';
import { buildBundle, loadConfigFromYaml } from '../lib/bundle-builder.js';
import { loadConnector } from '../lib/connector-loader.js';
import { createMockCtx } from '../lib/runtime.js';
import { LinktoolStorage } from '../lib/storage.js';

const DEFAULT_TUNNEL_BASE_URL = 'https://tun.dev.mcplinx.com';

export type TestAuthOptions = {
    cliConnectorId?: string;
    showUrlOnly?: boolean;
};

export type TestAuthContext = {
    userHashId: string;
    tunnelBaseUrl?: string;
    callbackPath?: string;
};

type RunInteractiveInput = {
    packageName: string;
    authContext: TestAuthContext;
    options: TestAuthOptions;
};

export type InteractiveTunnelSession = {
    connect: () => Promise<void>;
    close: () => void | Promise<void>;
    setRequestHandler: (handler: (payload: any) => Promise<unknown>) => void;
};

export type InteractiveAuthInput = {
    packageName: string;
    authContext: TestAuthContext;
};

type TestAuthDeps = {
    ensureProject?: (ctx: LinktoolCoreContext) => Promise<void> | void;
    getPackageName?: (cwd: string) => string;
    getAuthContext?: (ctx: LinktoolCoreContext, packageName: string) => Promise<TestAuthContext> | TestAuthContext;
    writeStdout?: (value: string) => void;
    runInteractive?: (input: RunInteractiveInput) => Promise<void>;
};

export function buildDefaultOAuthRedirectUri(tunnelHost: string, userHashId: string, packageName: string): string {
    const normalizedHost = String(tunnelHost ?? '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `https://${normalizedHost}/${userHashId}/${packageName}/callback`;
}

export async function runTestAuth(
    ctx: LinktoolCoreContext,
    options: TestAuthOptions,
    deps: TestAuthDeps = {},
): Promise<void> {
    deps.ensureProject?.(ctx);

    const packageName = deps.getPackageName?.(ctx.cwd);
    if (!packageName) {
        throw new Error('Missing package name');
    }

    const authContext = await deps.getAuthContext?.(ctx, packageName);
    if (!authContext) {
        throw new Error('Missing auth context');
    }

    const tunnelBaseUrl = normalizeTunnelBaseUrl(authContext.tunnelBaseUrl ?? ctx.tunnelBaseUrl ?? DEFAULT_TUNNEL_BASE_URL);

    if (options.showUrlOnly) {
        const callbackUrl = authContext.callbackPath
            ? `${tunnelBaseUrl}${normalizeCallbackPath(authContext.callbackPath)}`
            : buildDefaultOAuthRedirectUri(tunnelBaseUrl, authContext.userHashId, packageName);
        (deps.writeStdout ?? process.stdout.write.bind(process.stdout))(`${callbackUrl}\n`);
        return;
    }

    if (!deps.runInteractive) {
        throw new Error('Interactive auth flow is not available');
    }

    await deps.runInteractive({
        packageName,
        authContext,
        options,
    });
}

type InteractiveAuthDeps = {
    loadConnector?: (cwd: string) => Promise<any>;
    createTunnelSession?: (
        ctx: LinktoolCoreContext,
        input: InteractiveAuthInput,
    ) => Promise<{
        tunnel: InteractiveTunnelSession;
        callbackUrl: string;
    }>;
    promptInput?: (label: string) => Promise<string>;
    writeStdout?: (value: string) => void;
};

export async function runInteractiveTestAuth(
    ctx: LinktoolCoreContext,
    input: InteractiveAuthInput,
    deps: InteractiveAuthDeps = {},
): Promise<void> {
    const connector = await (deps.loadConnector ?? loadConnector)(ctx.cwd);
    if (!connector?.authentication) {
        throw new Error('No authentication configured for this connector.');
    }

    const authType = connector.authentication.type;
    if (authType === 'oauth2') {
        await handleOAuth2Interactive(ctx, connector, input, deps);
        return;
    }

    if (authType === 'api_key' || authType === 'session' || authType === 'basic' || authType === 'custom') {
        await handleFormInteractive(ctx, connector, deps);
        return;
    }

    throw new Error(`Unsupported authentication type: ${authType}`);
}

function normalizeTunnelBaseUrl(value: string): string {
    const normalized = String(value ?? '').trim().replace(/\/+$/, '');
    if (!normalized) throw new Error('Missing tunnel base url');
    return normalized.startsWith('http://') || normalized.startsWith('https://') ? normalized : `https://${normalized}`;
}

function normalizeCallbackPath(value: string): string {
    const normalized = String(value ?? '').trim();
    if (!normalized) throw new Error('Missing callback path');
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

async function handleOAuth2Interactive(
    ctx: LinktoolCoreContext,
    connector: any,
    input: InteractiveAuthInput,
    deps: InteractiveAuthDeps,
): Promise<void> {
    if (!deps.createTunnelSession) {
        throw new Error('Missing tunnel session factory');
    }

    const oauth2Auth = connector.authentication as any;
    const { tunnel, callbackUrl } = await deps.createTunnelSession(ctx, input);
    await tunnel.connect();

    const done = new Promise<void>((resolve, reject) => {
        tunnel.setRequestHandler(async (payload: any) => {
            try {
                const callback = new URL(String(payload.url ?? ''));
                const code = callback.searchParams.get('code');
                if (!code) {
                    return null;
                }

                const authData = await exchangeOAuthToken(ctx, connector, oauth2Auth, code, callbackUrl);
                const connectionName = await testAndResolveConnectionName(ctx, connector, authData);
                const storage = new LinktoolStorage(ctx.cwd);
                storage.saveConnection({
                    name: connectionName,
                    authData,
                });
                (deps.writeStdout ?? process.stdout.write.bind(process.stdout))(
                    `${JSON.stringify({ callbackUrl: payload.url, connectionName }, null, 2)}\n`,
                );
                resolve();
                return null;
            } catch (error) {
                reject(error);
                throw error;
            } finally {
                await tunnel.close();
            }
        });
    });

    const authUrl = await buildOAuthAuthorizeUrl(ctx, oauth2Auth, callbackUrl);
    (deps.writeStdout ?? process.stdout.write.bind(process.stdout))(`${authUrl}\n`);
    await done;
}

async function handleFormInteractive(
    ctx: LinktoolCoreContext,
    connector: any,
    deps: InteractiveAuthDeps,
): Promise<void> {
    const fields = Array.isArray(connector.authentication?.fields) ? connector.authentication.fields : [];
    const promptInput = deps.promptInput ?? defaultPromptInput;
    const authData: Record<string, string> = {};

    for (const field of fields) {
        const value = await promptInput(String(field.label ?? field.key ?? 'value'));
        if (field.required && !String(value).trim()) {
            throw new Error(`${String(field.label ?? field.key)} is required`);
        }
        authData[String(field.key)] = value;
    }

    const connectionName = await testAndResolveConnectionName(ctx, connector, authData);
    const storage = new LinktoolStorage(ctx.cwd);
    storage.saveConnection({
        name: connectionName,
        authData,
    });
}

async function exchangeOAuthToken(
    ctx: LinktoolCoreContext,
    connector: any,
    oauth2Auth: any,
    code: string,
    redirectUri: string,
): Promise<Record<string, unknown>> {
    const bundle = buildBundle(ctx.cwd, {
        authData: {
            code,
            redirect_uri: redirectUri,
        },
        inputData: {
            code,
            redirect_uri: redirectUri,
        },
    });
    const zObject = createMockCtx(connector, bundle);
    const getAccessToken = oauth2Auth.oauth2Config?.getAccessToken;
    if (typeof getAccessToken === 'function') {
        return await getAccessToken(zObject, bundle);
    }
    return { code };
}

async function buildOAuthAuthorizeUrl(
    ctx: LinktoolCoreContext,
    oauth2Auth: any,
    redirectUri: string,
): Promise<string> {
    const authConfig = oauth2Auth.oauth2Config;
    if (!authConfig) {
        throw new Error('OAuth2 config is missing');
    }

    const bundle = buildBundle(ctx.cwd, {
        inputData: {
            redirect_uri: redirectUri,
        },
    });
    const zObject = createMockCtx();

    if (typeof authConfig.authorizeUrl === 'function') {
        return await authConfig.authorizeUrl(zObject, bundle);
    }

    if (typeof authConfig.authorizeUrl === 'object' && authConfig.authorizeUrl) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(authConfig.authorizeUrl.params || {})) {
            params.append(key, String(value));
        }
        params.set('redirect_uri', redirectUri);
        const { vars } = loadConfigFromYaml(ctx.cwd);
        if (vars.CLIENT_ID) {
            params.set('client_id', String(vars.CLIENT_ID));
        }
        params.set('response_type', 'code');
        return `${authConfig.authorizeUrl.url}?${params.toString()}`;
    }

    return String(authConfig.authorizeUrl ?? '');
}

async function testAndResolveConnectionName(
    ctx: LinktoolCoreContext,
    connector: any,
    authData: Record<string, unknown>,
): Promise<string> {
    let connectionName = 'CLI Connection';
    const testFn = connector.authentication?.test;
    if (typeof testFn !== 'function') {
        return connectionName;
    }

    const testBundle = buildBundle(ctx.cwd, {
        authData,
        inputData: {},
    });
    const zObject = createMockCtx(connector, testBundle);
    const testResult = await testFn(zObject, testBundle);
    if (testResult?.label) {
        return String(testResult.label);
    }
    return applyConnectionLabelTemplate(connector.authentication?.connectionLabel, testResult, authData) || connectionName;
}

function applyConnectionLabelTemplate(
    template: unknown,
    testResult: Record<string, unknown> | undefined,
    authData: Record<string, unknown>,
): string {
    if (typeof template !== 'string' || !template.trim()) {
        return '';
    }
    return template.replace(/\{\{(\w+)\}\}/g, (_match: string, key: string) => {
        const fromTestResult = testResult?.[key];
        if (fromTestResult != null) return String(fromTestResult);
        const fromAuthData = authData[key];
        return fromAuthData != null ? String(fromAuthData) : `{{${key}}}`;
    });
}

async function defaultPromptInput(label: string): Promise<string> {
    const readline = await import('node:readline/promises');
    const { stdin, stdout } = await import('node:process');
    const rl = readline.createInterface({ input: stdin, output: stdout });
    try {
        return await rl.question(`${label}: `);
    } finally {
        rl.close();
    }
}
