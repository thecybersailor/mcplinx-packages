import { Command } from 'commander';
import chalk from 'chalk';
import { runTestRun } from '../../core/test-run.js';
import { CredentialsManager } from '../../lib/credentials.js';
import { getUserHashIdFromToken } from '../../lib/jwt-utils.js';
import { TunnelClient } from '../../lib/tunnel-client.js';

const TUNNEL_BASE_URL = normalizeTunnelBaseUrl(process.env.MCPLINX_TUNNEL_BASE_URL || 'tun.dev.mcplinx.com');
const TUNNEL_HOST = TUNNEL_BASE_URL.replace(/^https?:\/\//, '');

export function runCommand() {
  return new Command('run')
    .description('Run a tool')
    .argument('<tool-key>', 'Tool Key')
    .option(
      '-P, --param <key=value...>',
      'Input parameters (can be used multiple times)',
      (val, memo: any) => {
        const idx = val.indexOf('=');
        if (idx === -1) return memo;
        const key = val.substring(0, idx);
        const value = val.substring(idx + 1);
        memo[key] = value;
        return memo;
      },
      {},
    )
    .option('--poll-interval <seconds>', 'Polling interval in seconds for async tools (default: 60)', (val) => {
      const interval = parseInt(val, 10);
      if (isNaN(interval) || interval < 1) {
        throw new Error('Poll interval must be a positive number');
      }
      return interval * 1000;
    }, 60000)
    .action(async (toolKey, options) => {
      try {
        await runTestRun(
          {
            cwd: process.cwd(),
            tunnelBaseUrl: TUNNEL_BASE_URL,
          },
          toolKey,
          {
            params: options.param,
            pollIntervalMs: options.pollInterval,
          },
          {
            createTunnelSession: async (_ctx, input) => createDefaultTunnelSession(input.packageName),
          },
        );
      } catch (e: any) {
        console.error(chalk.red('Execution failed:'), e.message);
        if (e.stack) console.error(chalk.gray(e.stack));
        process.exit(1);
      }
    });
}

async function createDefaultTunnelSession(packageName: string) {
  const credsManager = new CredentialsManager();
  const creds = credsManager.loadCredentials();
  if (!creds?.token) {
    throw new Error('Not logged in. Please run "syntool login" first.');
  }

  const userHashId = getUserHashIdFromToken(creds.token);
  if (!userHashId) {
    throw new Error('User hashid not found in token. Please login again.');
  }

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
    webhookUrl: `${TUNNEL_BASE_URL}/${userHashId}/${packageName}/webhook`,
  };
}

function normalizeTunnelBaseUrl(value: string): string {
  const normalized = String(value ?? '').trim().replace(/\/+$/, '');
  if (!normalized) {
    throw new Error('Missing MCPLINX_TUNNEL_BASE_URL');
  }
  return normalized.startsWith('http://') || normalized.startsWith('https://') ? normalized : `https://${normalized}`;
}
