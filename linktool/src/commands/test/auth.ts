import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';
import {
  buildDefaultOAuthRedirectUri,
  runInteractiveTestAuth,
  runTestAuth,
} from '../../core/test-auth.js';
import { CredentialsManager } from '../../lib/credentials.js';
import { getUserHashIdFromToken } from '../../lib/jwt-utils.js';
import { getPackageName } from '../../lib/package-name.js';
import { TunnelClient } from '../../lib/tunnel-client.js';

const TUNNEL_BASE_URL = normalizeTunnelBaseUrl(process.env.MCPLINX_TUNNEL_BASE_URL || 'tun.dev.mcplinx.com');
const TUNNEL_HOST = TUNNEL_BASE_URL.replace(/^https?:\/\//, '');

export function authCommand() {
  return new Command('auth')
    .description('Start OAuth flow for a connector')
    .argument('[connector-id]', 'Connector ID (optional)')
    .option('--show-url-only', 'Only show OAuth callback URL without starting OAuth flow')
    .action(async (cliConnectorId, options) => {
      const cwd = process.cwd();

      try {
        await runTestAuth(
          {
            cwd,
            tunnelBaseUrl: TUNNEL_BASE_URL,
          },
          {
            cliConnectorId,
            showUrlOnly: options.showUrlOnly,
          },
          {
            ensureProject: ensureProjectDirectory,
            getPackageName: (workdir) => getPackageName(workdir),
            getAuthContext: () => resolveDefaultAuthContext(),
            writeStdout: (value) => process.stdout.write(options.showUrlOnly ? chalk.green(value) : value),
            runInteractive: async ({ packageName, authContext }) => {
              await runInteractiveTestAuth(
                {
                  cwd,
                  tunnelBaseUrl: TUNNEL_BASE_URL,
                },
                {
                  packageName,
                  authContext,
                },
                {
                  createTunnelSession: async () => createDefaultTunnelSession(packageName, authContext.userHashId),
                },
              );
            },
          },
        );
      } catch (e: any) {
        console.error(chalk.red(e.message));
        if (e.stack) console.error(chalk.gray(e.stack));
        process.exit(1);
      }
    });
}

function ensureProjectDirectory(ctx: { cwd: string }) {
  const packageJsonPath = join(ctx.cwd, 'package.json');
  if (!existsSync(packageJsonPath)) {
    throw new Error('Not in a connector package directory.');
  }
}

function resolveDefaultAuthContext(): {
  userHashId: string;
  tunnelBaseUrl: string;
} {
  const credsManager = new CredentialsManager();
  const creds = credsManager.loadCredentials();
  if (!creds?.token) {
    throw new Error('Not logged in. Please run "syntool login" first.');
  }

  const userHashId = getUserHashIdFromToken(creds.token);
  if (!userHashId) {
    throw new Error('User hashid not found in token. Please run "syntool login" again.');
  }

  return {
    userHashId,
    tunnelBaseUrl: TUNNEL_BASE_URL,
  };
}

async function createDefaultTunnelSession(packageName: string, userHashId: string) {
  const tunnel = new TunnelClient({
    host: TUNNEL_HOST,
    packageName,
  });

  return {
    tunnel: {
      connect: () => tunnel.connect(),
      close: () => tunnel.close(),
      setRequestHandler: (handler: (payload: any) => Promise<unknown>) => {
        tunnel.requestHandler = handler;
      },
    },
    callbackUrl: buildDefaultOAuthRedirectUri(TUNNEL_BASE_URL, userHashId, packageName),
  };
}

function normalizeTunnelBaseUrl(value: string): string {
  const normalized = String(value ?? '').trim().replace(/\/+$/, '');
  if (!normalized) {
    throw new Error('Missing MCPLINX_TUNNEL_BASE_URL');
  }
  return normalized.startsWith('http://') || normalized.startsWith('https://') ? normalized : `https://${normalized}`;
}
