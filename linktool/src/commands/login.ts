import { Command } from 'commander';
import chalk from 'chalk';
// Open will be imported dynamically in the action
import { createApi } from '@mcplinx/api-client-auth/wrapper';
import { CredentialsManager } from '../lib/credentials.js';
import { buildCliLoginUrl } from '../lib/web-urls.js';
import inquirer from 'inquirer';

const DEFAULT_HOST = process.env.MCPLINX_API_BASE_URL || 'https://api.mcplinx.com';
const WEB_BASE_URL = process.env.MCPLINX_WEB_BASE_URL || 'https://www.mcplinx.com';
const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_ATTEMPTS = 150; // 5 minutes

export function loginCommand() {
    return new Command('login')
        .description('Login to mcplinx')
        .option('--no-open', 'Skip automatic browser opening')
        .action(async (options) => {
            if (process.argv.includes('--host')) {
                throw new Error('Repository policy: overriding host via CLI flags is disabled.')
            }

            const authMode = process.env.LINKTOOL_AUTH_MODE || process.env.MCPLINX_AUTH_MODE || 'browser';
            const host = DEFAULT_HOST.replace(/\/$/, '');
            console.log(chalk.blue('🔐 Starting login flow...'));
            
            // Only show host if debug is enabled
            const isDebugEnabled = process.env.DEBUG === '1' || 
                                  process.env.DEBUG === 'true' || 
                                  process.env.LINKTOOL_DEBUG === '1' || 
                                  process.env.LINKTOOL_DEBUG === 'true';
            if (isDebugEnabled) {
                console.log(chalk.gray(`Host: ${host}`));
            }

            if (authMode === 'local') {
                const answer = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'email',
                        message: 'Email',
                        default: 'dev@example.com',
                        validate: (v: string) => (!!v && v.includes('@')) || 'Please enter a valid email',
                    }
                ])
                const email = String(answer.email || 'dev@example.com').trim()
                const issuer = process.env.MCPLINX_LOCAL_ISSUER_URL || 'http://127.0.0.1:16901'

                const resp = await fetch(`${issuer.replace(/\/$/, '')}/issue`, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ email }),
                })
                if (!resp.ok) {
                    const txt = await resp.text()
                    throw new Error(`local issuer failed: ${resp.status} ${resp.statusText} ${txt}`)
                }
                const data = await resp.json() as any
                const token = data.access_token
                if (!token) throw new Error('local issuer returned empty access_token')

                const credsMgr = new CredentialsManager();
                credsMgr.saveCredentials({
                    token,
                    refreshToken: '',
                    email,
                    host,
                    appId: 'mcplinx',
                });

                console.log(chalk.green(`\n✓ Logged in successfully as ${email}!`));
                console.log(chalk.gray(`✓ Token saved to ~/.syntool/credentials.json`));
                return
            }

            // Dynamically import open (ESM package)
            const { default: open } = await import('open');

            try {
                // 1. Create Session using Auth API client
                const authApi = createApi({
                    baseUrl: host,
                });

                const session = await authApi.auth.sessionsCreate({
                    client_name: 'syntool',
                    client_version: '0.1.0'
                });

                const sessionId = session.session_id;
                if (!sessionId) {
                    throw new Error('Failed to create session: no session_id returned');
                }

                // 2. Open browser to WEB URL (not API URL!)
                const loginUrl = buildCliLoginUrl({ webBaseUrl: WEB_BASE_URL, sessionId, apiBaseUrl: host });

                console.log(`\n👉 Please complete login in your browser:`);
                console.log(chalk.underline(loginUrl));
                console.log(chalk.gray('\nWaiting for authentication...'));

                // Try to open browser, but handle cases where it's not available
                const isDebugEnabled = process.env.DEBUG === '1' || 
                                      process.env.DEBUG === 'true' || 
                                      process.env.LINKTOOL_DEBUG === '1' || 
                                      process.env.LINKTOOL_DEBUG === 'true';
                if (isDebugEnabled) {
                    console.log(chalk.gray(`🔗 Attempting to open: ${loginUrl.substring(0, 50)}...`));
                }
                try {
                    const openResult = await open(loginUrl);
                    if (isDebugEnabled) {
                        console.log(chalk.gray('✅ Browser opened automatically.'));

                        // Log the process info for debugging
                        if (openResult && typeof openResult === 'object') {
                            console.log(chalk.gray(`   Process PID: ${openResult.pid || 'unknown'}`));
                        }
                    }
                } catch (openError: any) {
                    console.log(chalk.yellow('⚠️  Could not open browser automatically.'));
                    console.log(chalk.yellow('Please manually copy and open the URL above in your browser.'));

                    // Provide more detailed error information
                    console.log(chalk.gray(`Error type: ${openError.constructor?.name || 'Unknown'}`));
                    console.log(chalk.gray(`Error message: ${openError.message}`));

                    if (openError.code) {
                        console.log(chalk.gray(`Error code: ${openError.code}`));
                    }

                    if (openError.errno) {
                        console.log(chalk.gray(`Error errno: ${openError.errno}`));
                    }

                    // Check for common issues
                    if (openError.message?.includes('spawn') || openError.message?.includes('ENOENT')) {
                        console.log(chalk.gray('Reason: Browser application not found on this system'));
                    } else if (openError.message?.includes('display') || openError.message?.includes('DISPLAY')) {
                        console.log(chalk.gray('Reason: No graphical display available (headless environment)'));
                    } else if (openError.message?.includes('permission') || openError.message?.includes('EACCES')) {
                        console.log(chalk.gray('Reason: Permission denied - check file permissions'));
                    } else {
                        console.log(chalk.gray('Reason: Unknown error - check system logs'));
                    }

                    console.log(chalk.cyan('\n💡 Tip: You can also run this command with --no-open to skip browser opening'));
                }

                // 3. Poll for completion
                let attempts = 0;
                while (attempts < MAX_POLLING_ATTEMPTS) {
                    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));

                    try {
                        const data = await authApi.auth.sessionsDetail(sessionId);

                        if (data.status === 'completed' && data.jwt) {
                            // Discover appId from hub and persist it for edge allowlist / JWKS resolution.
                            const meResp = await fetch(`${host}/v1/me`, {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${data.jwt}`,
                                }
                            });
                            if (!meResp.ok) {
                                const txt = await meResp.text();
                                throw new Error(`Failed to fetch /v1/me: ${meResp.status} ${meResp.statusText} - ${txt}`);
                            }
                            const meJson = await meResp.json() as any;
                            const appId = meJson?.data?.appId;
                            if (!appId || typeof appId !== 'string') {
                                throw new Error('Invalid /v1/me response: missing appId');
                            }

                            // Login successful - save both access_token and refresh_token
                            const credsMgr = new CredentialsManager();
                            credsMgr.saveCredentials({
                                token: data.jwt,
                                refreshToken: data.refresh_token, // Save refresh token if provided
                                email: data.user_email || 'unknown',
                                host,
                                appId,
                            });

                            console.log(chalk.green(`\n✓ Logged in successfully as ${data.user_email}!`));
                            console.log(chalk.gray(`✓ Token saved to ~/.syntool/credentials.json`));
                            return;
                        } else if (data.status === 'expired') {
                            console.error(chalk.red('\nLogin session expired. Please try again.'));
                            process.exit(1);
                        }
                    } catch (pollError) {
                        // Continue polling
                    }

                    attempts++;
                }

                console.error(chalk.red('\n✗ Login timeout. Please try again.'));
                process.exit(1);

            } catch (error: any) {
                console.error(chalk.red(`\n✗ Login failed: ${error.message}`));
                process.exit(1);
            }
        });
}
