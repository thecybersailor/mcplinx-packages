import WebSocket from 'ws';
import EventEmitter from 'events';
import chalk from 'chalk';
import { CredentialsManager, Credentials } from './credentials.js';
import { createApi as createAuthApi } from '@mcplinx/api-client-auth/wrapper';

export interface TunnelOptions {
    host: string;
    packageName: string;  // Changed from sessionId to packageName
    sessionId?: string;  // Optional: if provided, use it; otherwise create new
}

/**
 * Token refresh using Host API (which proxies to Supabase)
 */
async function refreshAccessToken(refreshToken: string, host: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
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

export class TunnelClient extends EventEmitter {
    private ws: WebSocket | null = null;
    private options: TunnelOptions;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private isClosed = false;
    private sessionId: string | null = null;
    private credsMgr: CredentialsManager;
    private host: string;
    private isRefreshing = false;
    private refreshPromise: Promise<Credentials | null> | null = null;

    constructor(options: TunnelOptions) {
        super();
        this.options = options;
        this.credsMgr = new CredentialsManager();
        const creds = this.credsMgr.loadCredentials();
        if (!creds) {
            this.host = 'https://api.mcplinx.com';
        } else {
            this.host = creds.host || 'https://api.mcplinx.com';
        }
    }

    /**
     * Ensure token is fresh before making requests
     */
    private async ensureFreshToken(): Promise<Credentials | null> {
        // If already refreshing, wait for that promise
        if (this.isRefreshing && this.refreshPromise) {
            return this.refreshPromise;
        }

        const currentCreds = this.credsMgr.loadCredentials();
        if (!currentCreds?.token) {
            throw new Error('Not logged in. Please run "linktool login" first.');
        }

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
        this.isRefreshing = true;

        this.refreshPromise = (async () => {
            const refreshed = await refreshAccessToken(currentCreds.refreshToken!, this.host);

            if (!refreshed) {
                console.error(chalk.red('Failed to refresh token. Please login again: linktool login'));
                this.isRefreshing = false;
                this.refreshPromise = null;
                return null;
            }

            const newCreds: Credentials = {
                ...currentCreds,
                token: refreshed.accessToken,
                refreshToken: refreshed.refreshToken,
            };

            this.credsMgr.saveCredentials(newCreds);
            console.log(chalk.green('✓ Token refreshed successfully'));

            this.isRefreshing = false;
            this.refreshPromise = null;
            return newCreds;
        })();

        return this.refreshPromise;
    }

    async connect() {
        if (this.isClosed) return;

        const { host, packageName, sessionId: providedSessionId } = this.options;
        
        // If sessionId is provided, use it; otherwise create new session
        if (providedSessionId) {
            this.sessionId = providedSessionId;
        } else {
            // Create new session by calling tun system
            try {
                // Ensure token is fresh
                const freshCreds = await this.ensureFreshToken();
                if (!freshCreds?.token) {
                    throw new Error('Not logged in. Please run "linktool login" first.');
                }

                const protocol = host.startsWith('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
                const sessionUrl = `${protocol}://${host}/_session?package=${encodeURIComponent(packageName)}`;
                
                console.log(chalk.gray(`Creating session: ${sessionUrl}`));
                
                let response = await fetch(sessionUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${freshCreds.token}`,
                        'Content-Type': 'application/json',
                        ...(freshCreds.appId ? { 'X-MCPLINX-APP-ID': freshCreds.appId } : {})
                    }
                });
                
                // If 401, refresh token and retry
                if (response.status === 401) {
                    console.log(chalk.yellow('401 Unauthorized - Refreshing token and retrying...'));
                    const retryCreds = await this.ensureFreshToken();
                    if (!retryCreds?.token) {
                        const errorText = await response.text();
                        throw new Error(`Failed to create session: ${response.status} ${response.statusText} - ${errorText}`);
                    }
                    
                    response = await fetch(sessionUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${retryCreds.token}`,
                            'Content-Type': 'application/json',
                            ...(retryCreds.appId ? { 'X-MCPLINX-APP-ID': retryCreds.appId } : {})
                        }
                    });
                }
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to create session: ${response.status} ${response.statusText} - ${errorText}`);
                }
                
                const data = await response.json() as { sessionId: string };
                this.sessionId = data.sessionId;
                console.log(chalk.gray(`Session created: ${this.sessionId}`));
            } catch (err: any) {
                console.error(chalk.red('Failed to create session:'), err.message);
                throw err;
            }
        }
        if (!this.sessionId) {
            throw new Error('Session ID not available');
        }

        // Ensure token is fresh before connecting
        const freshCreds = await this.ensureFreshToken();
        if (!freshCreds?.token) {
            throw new Error('Not logged in. Please run "linktool login" first.');
        }
        
        // 如果 host 包含协议则使用，否则默认
        let url: string;
        if (host.includes('://')) {
            url = `${host.replace('http', 'ws')}/_ws?session=${this.sessionId}&token=${encodeURIComponent(freshCreds.token)}`;
        } else {
            const protocol = host.startsWith('localhost') || host.includes('127.0.0.1') ? 'ws' : 'wss';
            url = `${protocol}://${host}/_ws?session=${this.sessionId}&token=${encodeURIComponent(freshCreds.token)}`;
        }

        console.log(chalk.gray(`Connecting to tunnel: ${url.replace(freshCreds.token, '***')}`));

        this.ws = new WebSocket(
            url,
            freshCreds.appId ? { headers: { 'X-MCPLINX-APP-ID': freshCreds.appId } } : undefined
        );

        this.ws.on('open', () => {
            console.log(chalk.green('✓ Tunnel connected'));
            this.emit('connected');
        });

        this.ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'request') {
                    this.handleRequest(msg.payload);
                } else if (msg.type === 'pong') {
                    // ignore
                }
            } catch (err) {
                console.error('Error parsing tunnel message:', err);
            }
        });

        this.ws.on('close', () => {
            if (!this.isClosed) {
                console.log(chalk.yellow('Tunnel disconnected, reconnecting in 3s...'));
                this.ws = null;
                this.reconnect();
            }
        });

        this.ws.on('error', (err) => {
            if (!this.isClosed) {
                console.error(chalk.red('Tunnel error:'), err.message);
            }
        });
    }

    close() {
        this.isClosed = true;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    private reconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    }

    private async handleRequest(payload: any) {
        console.log(chalk.blue(`📥 Received Webhook: ${payload.method} ${payload.url}`));

        // Default response
        let response = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ received: true })
        };

        // Emit event via Promise to allow async handling
        // Since EventEmitter is synchronous for return values, we expect listeners
        // to handle logic. However, to get a return value, we can use a custom approach or assume
        // the listener will return a Promise. But standard emit doesn't return that.
        // We will just invoke the 'onRequest' handler if set.

        try {
            // Check if we have an external handler set
            if (this.requestHandler) {
                const result = await this.requestHandler(payload);
                if (result) response = result;
            } else {
                this.emit('request', payload);
            }
        } catch (err: any) {
            console.error(chalk.red('Error handling request:'), err);
            response = {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: err.message })
            };
        }

        // Send response back
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'response',
                payload: {
                    id: payload.id,
                    response
                }
            }));
            console.log(chalk.gray(`📤 Sent response: ${response.status}`));
        }
    }

    // Custom handler assignment
    public requestHandler: ((payload: any) => Promise<any>) | null = null;
    
    // Get current session ID
    public getSessionId(): string | null {
        return this.sessionId;
    }
}
