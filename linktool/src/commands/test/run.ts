import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { join } from 'path';
import { loadConnector } from '../../lib/connector-loader.js';
import { createMockCtx } from '../../lib/runtime.js';
import { getPackageName } from '../../lib/package-name.js';
import { TunnelClient } from '../../lib/tunnel-client.js';
import { LinktoolStorage } from '../../lib/storage.js';
import { buildBundle } from '../../lib/bundle-builder.js';
import { getUserHashIdFromToken } from '../../lib/jwt-utils.js';
import { CredentialsManager } from '../../lib/credentials.js';

export function runCommand() {
    return new Command('run')
        .description('Run a tool')
        .argument('<tool-key>', 'Tool Key')

        .option('-P, --param <key=value...>', 'Input parameters (can be used multiple times)', (val, memo: any) => {
            const idx = val.indexOf('=');
            if (idx === -1) return memo;
            const key = val.substring(0, idx);
            const value = val.substring(idx + 1);
            memo[key] = value;
            return memo;
        }, {})
        .option('--poll-interval <seconds>', 'Polling interval in seconds for async tools (default: 60)', (val) => {
            const interval = parseInt(val, 10);
            if (isNaN(interval) || interval < 1) {
                throw new Error('Poll interval must be a positive number');
            }
            return interval * 1000; // Convert to milliseconds
        }, 60000) // Default: 60 seconds = 60000 milliseconds
        .action(async (toolKey, options) => {
            const cwd = process.cwd();
            const storage = new LinktoolStorage(cwd);

            try {
                const connector = await loadConnector(cwd);

                // Find Tool
                let tool = connector.tools?.[toolKey];
                if (!tool) {
                    console.error(chalk.red(`Tool '${toolKey}' not found in connector.`));
                    process.exit(1);
                }

                console.log(chalk.cyan(`🔌 Tool: ${tool.name} (${toolKey})`));

                // Load Auth
                const authData = storage.loadAuth() || {};
                if (!storage.hasAuth() && connector.authentication) {
                    console.warn(chalk.yellow('⚠ No auth found. Run `npx linktool auth` first.'));
                }

                // Load Input Data
                // Priority: 1. Saved config  2. --input option
                let inputData: Record<string, any> = {};

                // 1. Load from saved config
                const savedConfig = storage.loadToolConfig(toolKey);
                if (savedConfig) {
                    console.log(chalk.gray(`Loading config from .linktool/config.json`));
                    inputData = savedConfig;
                }

                // 2. Merge with -P params
                if (options.param && Object.keys(options.param).length > 0) {
                    console.log(chalk.gray(`Applying parameters: ${JSON.stringify(options.param)}`));
                    inputData = { ...inputData, ...options.param };
                }



                // Async tunnel setup - auto-detect based on tool kind
                let tunnel: TunnelClient | null = null;
                const packageName = getPackageName(cwd);
                let tunnelBaseUrl: string | undefined;

                // Auto-detect modes
                const isWebhookMode = tool.kind === 'async' && typeof tool.webhookHandler === 'function';
                const isPollingMode = tool.kind === 'async' && typeof tool.checkStatus === 'function' && !isWebhookMode;

                if (isWebhookMode) {
                    const TUNNEL_HOST = (process.env.MCPLINX_TUNNEL_BASE_URL || 'tun.dev.mcplinx.com')
                        .replace(/^https?:\/\//, '')
                        .replace(/\/$/, '');
                    tunnel = new TunnelClient({
                        host: TUNNEL_HOST,
                        packageName: packageName
                    });
                    console.log(chalk.gray(`Async mode: creating session and connecting tunnel...`));

                    // Connect (will create session automatically)
                    await tunnel.connect();
                    
                    // Build webhook URL using format: /{user-hashid}/{package-name}/webhook
                    // Get user hashid from credentials
                    const credsManager = new CredentialsManager();
                    const creds = credsManager.loadCredentials();
                    if (!creds?.token) {
                        throw new Error('Not logged in. Please run "linktool login" first.');
                    }
                    
                    const userHashId = getUserHashIdFromToken(creds.token);
                    if (!userHashId) {
                        throw new Error('User hashid not found in token. Please login again.');
                    }
                    
                    // Format: /{user-hashid}/{package-name}/webhook
                    tunnelBaseUrl = `https://${TUNNEL_HOST}/${userHashId}/${packageName}/webhook`;
                    console.log(chalk.gray(`Webhook URL: ${tunnelBaseUrl}`));

                    // Wait for connection to be established
                    await new Promise(r => setTimeout(r, 1000));
                }

                // Prepare Bundle
                const bundle = buildBundle(cwd, {
                    authData,
                    inputData,
                    targetUrl: isWebhookMode ? tunnelBaseUrl : undefined,
                    cleanedRequest: inputData,
                    meta: {
                        webhookUrl: isWebhookMode ? tunnelBaseUrl : undefined
                    }
                });

                const zObject = createMockCtx(connector, bundle);

                console.log(chalk.blue('Running perform...'));
                console.log(chalk.gray(`Input: ${JSON.stringify(inputData, null, 2)}`));
                console.time('Duration');

                let result;
                if (typeof tool.perform === 'function') {
                    result = await tool.perform(zObject, bundle);
                } else {
                    console.error(chalk.red("Tool perform must be a function"));
                    process.exit(1);
                }

                console.timeEnd('Duration');
                console.log(chalk.green('✓ Result:'));
                console.log(JSON.stringify(result, null, 2));

                if (isWebhookMode && tunnel) {
                    console.log(chalk.yellow('\nWebhook mode enabled. Waiting for webhooks... (Ctrl+C to stop)'));
                    
                    // Set up webhook handler
                    tunnel.requestHandler = async (payload: any) => {
                        try {
                            // Parse webhook body
                            let body: any = {};
                            try {
                                if (payload.body) {
                                    body = JSON.parse(payload.body);
                                }
                            } catch (e) {
                                // If not JSON, try to parse as URL-encoded
                                body = payload.body || {};
                            }

                            // Create webhook bundle
                            const webhookBundle = {
                                rawRequest: {
                                    body,
                                    headers: payload.headers || {},
                                    method: payload.method,
                                    url: payload.url
                                },
                                inputData: {},
                                cleanedRequest: typeof body === 'object' && body !== null ? body : {},
                                authData,
                                meta: bundle.meta
                            };

                            // Call webhookHandler (we already checked it exists)
                            const webhookResult = await tool.webhookHandler!(zObject, webhookBundle);
                            
                            // Check status
                            if (webhookResult.status === 'completed' || webhookResult.status === 'failed') {
                                console.log(chalk.green(`\n✓ Task ${webhookResult.status}:`));
                                console.log(JSON.stringify(webhookResult, null, 2));
                                
                                // Close tunnel and exit
                                tunnel.close();
                                process.exit(webhookResult.status === 'failed' ? 1 : 0);
                            } else {
                                console.log(chalk.gray(`Task status: ${webhookResult.status}`));
                            }

                            return {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ received: true })
                            };
                        } catch (err: any) {
                            console.error(chalk.red('Error handling webhook:'), err);
                            return {
                                status: 500,
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ error: err.message })
                            };
                        }
                    };

                    // Keep process alive until webhook handler exits
                    // The handler will call process.exit() when task completes
                } else if (isPollingMode) {
                    // Polling mode: automatically poll checkStatus until completion
                    const pollIntervalMs = options.pollInterval || 60000; // Default: 60 seconds
                    const pollIntervalSec = pollIntervalMs / 1000;
                    console.log(chalk.yellow(`\nPolling mode enabled. Checking status every ${pollIntervalSec} seconds...`));

                    const pollStatus = async () => {
                        try {
                            const checkBundle = {
                                inputData: { taskId: result.taskId },
                                authData,
                                cleanedRequest: { taskId: result.taskId },
                                meta: bundle.meta
                            };

                            const statusResult = await tool.checkStatus!(zObject, checkBundle);

                            console.log(chalk.gray(`Status: ${statusResult.status}`));
                            if (statusResult.result) {
                                console.log(chalk.gray(`Result: ${JSON.stringify(statusResult.result, null, 2)}`));
                            }

                            if (statusResult.status === 'completed' || statusResult.status === 'failed') {
                                console.log(chalk.green(`\n✓ Task ${statusResult.status}:`));
                                console.log(JSON.stringify({
                                    taskId: result.taskId,
                                    status: statusResult.status,
                                    result: statusResult.result
                                }, null, 2));
                                process.exit(statusResult.status === 'failed' ? 1 : 0);
                            } else {
                                // Continue polling after configured interval
                                setTimeout(pollStatus, pollIntervalMs);
                            }
                        } catch (error: any) {
                            console.error(chalk.red('Error polling status:'), error.message);
                            process.exit(1);
                        }
                    };

                    // Start polling after a short delay
                    setTimeout(pollStatus, 1000);
                } else {
                    // Sync mode or unknown async mode
                    process.exit(0);
                }

            } catch (e: any) {
                console.error(chalk.red('Execution failed:'), e.message);
                if (e.stack) console.error(chalk.gray(e.stack));
                process.exit(1);
            }
        });
}
