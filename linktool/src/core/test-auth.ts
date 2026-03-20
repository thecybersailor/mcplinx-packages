import type { LinktoolCoreContext } from './types.js';

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
