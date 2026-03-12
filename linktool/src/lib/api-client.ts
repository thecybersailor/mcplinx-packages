import { createApi, ApiError } from '@mcplinx/api-client-developer/wrapper';
import { createApi as createAuthApi } from '@mcplinx/api-client-auth/wrapper';
import chalk from 'chalk';
import { CredentialsManager, Credentials } from './credentials.js';

/**
 * Token refresh using Host API (which proxies to Supabase)
 * This avoids needing to hardcode SUPABASE_ANON_KEY in the CLI
 */
async function refreshAccessToken(refreshToken: string, host: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
        // Use the generated Auth API client for type safety
        const authApi = createAuthApi({
            baseUrl: host,
        });

        const data = await authApi.auth.refreshCreate({
            refresh_token: refreshToken,
        });

        if (!data.access_token || !data.refresh_token) {
            console.error(chalk.red('Invalid refresh response: missing tokens'));
            return null;
        }

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
        };
    } catch (error) {
        console.error(chalk.red('Error refreshing token:'), error);
        return null;
    }
}

/**
 * Check if token is expired or near expiry
 */
function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const exp = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        // Consider expired if less than 5 minutes remaining
        return exp - now < 5 * 60 * 1000;
    } catch (error) {
        return true;
    }
}

/**
 * Create a Developer API client with automatic token refresh
 * 
 * This client:
 * - Automatically refreshes expired tokens
 * - Retries 401 errors with refreshed token
 * - Provides type-safe API calls
 * - Handles errors consistently
 */
export function createDeveloperApiClient() {
    const credsMgr = new CredentialsManager();
    let creds = credsMgr.loadCredentials();

    if (!creds?.token) {
        console.error(chalk.red('Not logged in. Please run: linktool login'));
        process.exit(1);
    }

    const host = creds.host || 'https://api.mcplinx.com';
    
    // Only show debug info if DEBUG or LINKTOOL_DEBUG is enabled
    const isDebugEnabled = process.env.DEBUG === '1' || 
                          process.env.DEBUG === 'true' || 
                          process.env.LINKTOOL_DEBUG === '1' || 
                          process.env.LINKTOOL_DEBUG === 'true';
    if (isDebugEnabled) {
        console.log(chalk.gray(`[DEBUG] API BaseURL: ${host}`));
        console.log(chalk.gray(`[DEBUG] Token: ${creds.token.substring(0, 20)}...`));
    }

    let isRefreshing = false;
    let refreshPromise: Promise<Credentials | null> | null = null;

    const ensureFreshToken = async (): Promise<Credentials | null> => {
        // If already refreshing, wait for that promise
        if (isRefreshing && refreshPromise) {
            return refreshPromise;
        }

        const currentCreds = credsMgr.loadCredentials();
        if (!currentCreds) return null;

        // Check if token needs refresh
        if (!isTokenExpired(currentCreds.token)) {
            return currentCreds;
        }

        // Token is expired, refresh it
        if (!currentCreds.refreshToken) {
            console.error(chalk.red('Token expired and no refresh token available. Please login again: linktool login'));
            return null;
        }

        console.log(chalk.yellow('Token expired, refreshing...'));
        isRefreshing = true;

        refreshPromise = (async () => {
            const refreshed = await refreshAccessToken(currentCreds.refreshToken!, host);

            if (!refreshed) {
                console.error(chalk.red('Failed to refresh token. Please login again: linktool login'));
                isRefreshing = false;
                refreshPromise = null;
                return null;
            }

            const newCreds: Credentials = {
                ...currentCreds,
                token: refreshed.accessToken,
                refreshToken: refreshed.refreshToken,
            };

            credsMgr.saveCredentials(newCreds);
            console.log(chalk.green('✓ Token refreshed successfully'));

            isRefreshing = false;
            refreshPromise = null;
            return newCreds;
        })();

        return refreshPromise;
    };

    const api = createApi({
        baseUrl: host,
        securityWorker: async () => {
            // Ensure token is fresh before each request
            const freshCreds = await ensureFreshToken();

            if (freshCreds?.token) {
                return {
                    headers: {
                        Authorization: `Bearer ${freshCreds.token}`,
                    },
                };
            }
            return {};
        },
        baseApiParams: {
            headers: {
                'Content-Type': 'application/json',
            },
        },
    });

    // Wrap API calls to handle 401 with automatic retry
    const originalDeveloper = api.developer;
    const wrappedDeveloper: any = {};

    for (const key in originalDeveloper) {
        const method = (originalDeveloper as any)[key];
        if (typeof method === 'function') {
            wrappedDeveloper[key] = async (...args: any[]) => {
                try {
                    return await method.apply(originalDeveloper, args);
                } catch (error: any) {
                    // Check if it's a 401 error
                    if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
                        console.log(chalk.yellow('401 Unauthorized - Refreshing token and retrying...'));

                        // Force refresh
                        const freshCreds = await ensureFreshToken();
                        if (!freshCreds) {
                            throw error;
                        }

                        // Retry the request
                        try {
                            return await method.apply(originalDeveloper, args);
                        } catch (retryError) {
                            console.error(chalk.red('Retry failed after token refresh'));
                            throw retryError;
                        }
                    }
                    throw error;
                }
            };
        }
    }

    return { developer: wrappedDeveloper };
}

// Re-export ApiError for error handling
export { ApiError };
