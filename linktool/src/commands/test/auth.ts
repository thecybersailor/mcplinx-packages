import { Command } from 'commander';
import chalk from 'chalk';
// Open will be imported dynamically
import { existsSync } from 'fs';
import { join } from 'path';
import { loadConnector } from '../../lib/connector-loader.js';
import { TunnelClient } from '../../lib/tunnel-client.js';
import { getPackageName } from '../../lib/package-name.js';
import { LinktoolStorage } from '../../lib/storage.js';
import { createMockCtx } from '../../lib/runtime.js';
import { CredentialsManager } from '../../lib/credentials.js';
import { getUserHashIdFromToken } from '../../lib/jwt-utils.js';
import { buildBundle, loadConfigFromYaml } from '../../lib/bundle-builder.js';

const TUNNEL_HOST = (process.env.MCPLINX_TUNNEL_BASE_URL || 'tun.dev.mcplinx.com')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

export function authCommand() {
    return new Command('auth')
        .description('Start OAuth flow for a connector')
        .argument('[connector-id]', 'Connector ID (optional)')
        .option('--show-url-only', 'Only show OAuth callback URL without starting OAuth flow')
        .action(async (cliConnectorId, options) => {
            const cwd = process.cwd();
            
            // Fast fail: Check if package.json exists
            const packageJsonPath = join(cwd, 'package.json');
            if (!existsSync(packageJsonPath)) {
                console.error(chalk.red('Error: Not in a connector package directory.'));
                console.error(chalk.yellow('Please run this command from a connector project directory with package.json.'));
                process.exit(1);
            }
            
            // Fast fail: Check if user is logged in
            const credsManager = new CredentialsManager();
            const creds = credsManager.loadCredentials();
            if (!creds?.token) {
                console.error(chalk.red('Error: Not logged in.'));
                console.error(chalk.yellow('Please run "linktool login" first.'));
                process.exit(1);
            }
            
            const userHashId = getUserHashIdFromToken(creds.token);
            if (!userHashId) {
                console.error(chalk.red('Error: User hashid not found in token.'));
                console.error(chalk.yellow('Please run "linktool login" again to refresh your token.'));
                process.exit(1);
            }
            
            // Get package name
            let packageName: string;
            try {
                packageName = getPackageName(cwd);
            } catch (e: any) {
                console.error(chalk.red('Error: Failed to read package.json.'));
                console.error(chalk.yellow(`Error: ${e.message}`));
                process.exit(1);
            }
            
            // If --show-url-only, just display the URL and exit
            if (options.showUrlOnly) {
                const callbackUrl = `https://${TUNNEL_HOST}/${userHashId}/${packageName}/callback`;
                console.log(chalk.green(callbackUrl));
                process.exit(0);
            }
            
            // Dynamically import open (ESM package)
            const { default: open } = await import('open');

            // Load config from .config.yml
            const configPath = join(cwd, '.config.yml');
            if (!existsSync(configPath)) {
                console.error(chalk.red('Error: .config.yml not found.'));
                console.error(chalk.yellow('Please create .config.yml with the following structure:'));
                console.error(chalk.gray(`
vars:
  CLIENT_ID: your_client_id_here
secrets:
  CLIENT_SECRET: your_client_secret_here
`));
                process.exit(1);
            }

            const connector = await loadConnector(cwd);

            if (cliConnectorId && packageName !== cliConnectorId) {
                console.warn(chalk.yellow(`Package name '${packageName}' does not match argument '${cliConnectorId}'`));
            }

            console.log(chalk.cyan(`🔌 Connector: ${connector.name || packageName} (${packageName})`));

            if (!connector.authentication) {
                console.error(chalk.red("Error: No authentication configured for this connector."));
                return;
            }

            const authType = connector.authentication.type;
            console.log(chalk.gray(`Authentication type: ${authType}`));

            // Route to appropriate handler based on auth type
            switch (authType) {
                case 'oauth2':
                    await handleOAuth2(connector, packageName, cwd, open);
                    break;
                case 'api_key':
                case 'session':
                case 'basic':
                case 'custom':
                    await handleFormAuth(connector, authType, cwd);
                    break;
                default:
                    console.error(chalk.red(`Unsupported authentication type: ${authType}`));
                    return;
            }
        });
}

async function handleOAuth2(connector: any, packageName: string, cwd: string, open: any) {
    const oauth2Auth = connector.authentication as any;

    console.log(chalk.gray(`Package: ${packageName}`));

    // Get user hashid from token for fixed URL
    const credsMgr = new CredentialsManager();
    const creds = credsMgr.loadCredentials();
    if (!creds?.token) {
        throw new Error('Not logged in. Please run "linktool login" first.');
    }

    const userHashId = getUserHashIdFromToken(creds.token);
    if (!userHashId) {
        throw new Error('User hashid not found in token. Please login again.');
    }

    // Use fixed URL format: /{user-hashid}/{package.json.name}/callback
    // packageName 已经是 package.json.name（去掉了 @ 前缀，保留了 /）
    // 例如: myorg/connector-name 或 connector-github
    const redirectUri = `https://${TUNNEL_HOST}/${userHashId}/${packageName}/callback`;

    console.log(chalk.cyan(`\n📋 Using fixed callback URL based on your user ID`));

    // Create tunnel client - we still need WebSocket connection for receiving callbacks
    const tunnel = new TunnelClient({
        host: TUNNEL_HOST,
        packageName: packageName
    });

    // Connect to create WebSocket session (for receiving callbacks)
    // The tunnel will use {user-hashid}-{package-name} as session ID
    await tunnel.connect();
    const sessionId = tunnel.getSessionId();
    if (!sessionId) {
        throw new Error('Failed to create tunnel session');
    }

    console.log(chalk.gray(`Tunnel session: ${sessionId}`));

    console.log(chalk.bold.yellow(`\n📋 Configure this Callback URL in your OAuth App:\n   ${redirectUri}\n`));

    // 收到请求回调
    tunnel.requestHandler = async (payload: any) => {
        if (payload.url.includes('/callback') || (payload.body && payload.body.includes('code='))) {
            console.log(chalk.green('✓ Received callback!'));

            const urlObj = new URL(payload.url);
            const code = urlObj.searchParams.get('code');

            if (code) {
                console.log(chalk.blue(`Code: ${code}`));

                try {
                    console.log('Exchanging token...');
                    const zObject = createMockCtx();

                    const bundle = buildBundle(cwd, {
                        authData: {
                            code: code,
                            redirect_uri: redirectUri
                        },
                        inputData: {
                            code: code,
                            redirect_uri: redirectUri
                        }
                    });

                    const getAccessToken = oauth2Auth.oauth2Config.getAccessToken;
                    let authData = {};

                    if (getAccessToken) {
                        authData = await getAccessToken(zObject, bundle);
                    } else {
                        console.warn("getAccessToken function not defined in connector. Saving code only.");
                        authData = { code };
                    }

                    console.log(chalk.green('✓ Token exchanged successfully!'));
                    console.log('Auth data:', authData);

                    let connectionName = 'Unknown';

                    // Test the authentication
                    if (oauth2Auth.test) {
                        console.log(chalk.gray('\nTesting authentication...'));
                        try {
                            const testBundle = buildBundle(cwd, {
                                authData,
                                inputData: {}
                            });
                            // Use createMockCtx with connector and bundle to enable interceptors
                            const zWithAuth = createMockCtx(connector, testBundle);

                            const testResult = await oauth2Auth.test(zWithAuth, testBundle);
                            console.log(chalk.green('✓ Authentication test passed!'));

                            // Extract connection label
                            // Priority: 1. testResult.label (from test() return) 2. connectionLabel template
                            if (testResult?.label) {
                                connectionName = testResult.label;
                                console.log(chalk.cyan(`\n🔗 Connected as: ${connectionName}`));
                            } else if (oauth2Auth.connectionLabel && testResult) {
                                let label = oauth2Auth.connectionLabel;
                                // Simple template replacement
                                if (typeof label === 'string') {
                                    label = label.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                                        return testResult[key] || match;
                                    });
                                }
                                connectionName = label;
                                console.log(chalk.cyan(`\n🔗 Connected as: ${label}`));
                            }

                            console.log(chalk.gray('\nUser info:'), testResult);
                        } catch (e: any) {
                            console.warn(chalk.yellow(`⚠ Authentication test failed: ${e.message}`));
                        }
                    }

                    const storage = new LinktoolStorage(cwd);
                    const savePath = storage.saveConnection({
                        name: connectionName,
                        authData
                    });
                    console.log(chalk.cyan(`\n💾 Connection saved to ${savePath}`));

                    setTimeout(() => {
                        tunnel.close();
                        process.exit(0);
                    }, 1000);

                    return { status: 200, body: 'Auth successful! You can close this window.' };

                } catch (e: any) {
                    console.error(chalk.red('Failed to exchange token:'), e);
                    return { status: 500, body: 'Failed to exchange token: ' + e.message };
                }
            }
        }
        return null;
    };

    // Already connected above, no need to connect again

    // Generate Auth URL
    try {
        const zObject = createMockCtx();
        const bundle = buildBundle(cwd, {
            inputData: {
                redirect_uri: redirectUri
            }
        });

        let authUrl = '';
        const authConfig = oauth2Auth.oauth2Config;

        // 处理 authorizeUrl
        if (typeof authConfig.authorizeUrl === 'function') {
            authUrl = await authConfig.authorizeUrl(zObject, bundle);
        } else if (typeof authConfig.authorizeUrl === 'object') {
            const conf = authConfig.authorizeUrl;
            const params = new URLSearchParams();

            // Add config params
            if (conf.params) {
                for (const k in conf.params) {
                    params.append(k, conf.params[k]);
                }
            }

            // Add essentials
            params.set('redirect_uri', redirectUri);
            const { vars } = loadConfigFromYaml(cwd);
            if (vars.CLIENT_ID) params.set('client_id', vars.CLIENT_ID);
            params.set('response_type', 'code');

            authUrl = `${conf.url}?${params.toString()}`;
        } else {
            authUrl = authConfig.authorizeUrl as string;
        }

        console.log(`Opening browser:\n${chalk.underline(authUrl)}`);

        try {
            await open(authUrl);
            console.log(chalk.gray('Browser opened automatically.'));
        } catch (openError: any) {
            console.log(chalk.yellow('⚠️  Could not open browser automatically.'));
            console.log(chalk.yellow('Please manually copy and open the URL above in your browser.'));
            console.log(chalk.gray(`Error: ${openError.message}`));
        }

    } catch (e: any) {
        console.error(chalk.red("Error generating auth URL:"), e);
        process.exit(1);
    }
}

async function handleFormAuth(connector: any, authType: string, cwd: string) {
    const inquirer = await import('inquirer');
    const fields = connector.authentication.fields || [];

    console.log(chalk.cyan(`\n📝 Please provide authentication credentials:\n`));

    // Dynamic generate form questions
    const questions = fields.map((field: any) => ({
        type: field.type === 'password' ? 'password' : 'input',
        name: field.key,
        message: field.label + (field.required ? ' *' : ''),
        default: field.default,
        validate: field.required ? (input: string) => {
            if (!input || input.trim() === '') {
                return `${field.label} is required`;
            }
            return true;
        } : undefined,
    }));

    const inq = (inquirer as any).default || inquirer;
    console.log(chalk.gray('DEBUG: Questions sent to inquirer:', JSON.stringify(questions, null, 2)));
    const authData = await inq.prompt(questions);

    let connectionName = 'CLI Connection';

    // Test the authentication if test function is defined
    if (connector.authentication.test) {
        console.log(chalk.gray('\nTesting authentication...'));
        try {
            const testBundle = buildBundle(cwd, {
                authData,
                inputData: {}
            });
            
            const zObject = createMockCtx(connector, testBundle);

            const testResult = await connector.authentication.test(zObject, testBundle);
            console.log(chalk.green('✓ Authentication test passed!'));

            // Extract connection label
            // Priority: 1. testResult.label (from test() return) 2. connectionLabel template
            if (testResult?.label) {
                connectionName = testResult.label;
                console.log(chalk.cyan(`\n🔗 Connected as: ${connectionName}`));
            } else if (connector.authentication.connectionLabel && testResult) {
                let label = connector.authentication.connectionLabel;
                if (typeof label === 'string') {
                    label = label.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => {
                        return testResult[key] || authData[key] || match;
                    });
                }
                connectionName = label;
                console.log(chalk.cyan(`\n🔗 Connected as: ${label}`));
            }

            console.log(chalk.gray('\nTest result:'), testResult);
        } catch (e: any) {
            console.warn(chalk.yellow(`⚠ Authentication test failed: ${e.message}`));
            console.log(chalk.gray('Saving credentials anyway...'));
        }
    }

    // Save credentials
    const storage = new LinktoolStorage(cwd);
    // Use connectionName from test result if available, otherwise fallback
    const finalConnectionName = connectionName || connector.authentication.connectionLabel || 'CLI Connection';
    const savePath = storage.saveConnection({
        name: finalConnectionName,
        authData
    });
    console.log(chalk.cyan(`\n💾 Connection saved to ${savePath}`));
}
