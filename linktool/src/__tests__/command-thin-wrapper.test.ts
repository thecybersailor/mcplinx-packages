import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const runTestAuth = vi.fn(async () => {});
const runInteractiveTestAuth = vi.fn(async () => {});
const runTestRun = vi.fn(async () => ({ mode: 'async-polling' }));

vi.mock('../core/test-auth.js', () => ({
  runTestAuth,
  runInteractiveTestAuth,
}));

vi.mock('../core/test-run.js', () => ({
  runTestRun,
}));

vi.mock('../lib/connector-loader.js', () => ({
  loadConnector: vi.fn(async () => {
    throw new Error('command wrapper should not load connector directly');
  }),
}));

vi.mock('../lib/credentials.js', () => ({
  CredentialsManager: class {
    loadCredentials() {
      return {
        token: 'token_1',
        appId: 'sample-app',
      };
    }
  },
}));

vi.mock('../lib/jwt-utils.js', () => ({
  getUserHashIdFromToken: vi.fn(() => 'user_hash_1'),
}));

vi.mock('open', () => ({
  default: vi.fn(async () => {}),
}));

function createTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('linktool command thin wrappers', () => {
  let cwd: string;
  let originalCwd: string;

  beforeEach(() => {
    cwd = createTempDir('linktool-command-wrapper-');
    originalCwd = process.cwd();
    fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ name: 'connector-example', version: '1.0.0' }), 'utf8');
    fs.writeFileSync(path.join(cwd, '.config.yml'), 'vars:\n  CLIENT_ID: demo\n', 'utf8');
    process.chdir(cwd);
    vi.resetAllMocks();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it('auth command delegates interactive flow to core test-auth runner', async () => {
    runTestAuth.mockImplementationOnce(async (_ctx, _options, deps) => {
      await deps.runInteractive?.({
        packageName: 'connector-example',
        authContext: {
          userHashId: 'user_hash_1',
          tunnelBaseUrl: 'https://tun.dev.mcplinx.com',
        },
        options: {},
      });
    });

    const { authCommand } = await import('../commands/test/auth.js');

    await authCommand().parseAsync(['auth'], { from: 'user' });

    expect(runTestAuth).toHaveBeenCalledTimes(1);
    expect(runInteractiveTestAuth).toHaveBeenCalledTimes(1);
  });

  it('run command delegates async tool execution to core runTestRun without local branching', async () => {
    const { runCommand } = await import('../commands/test/run.js');

    await runCommand().parseAsync(['run', 'async_polling'], { from: 'user' });

    expect(runTestRun).toHaveBeenCalledTimes(1);
  });
});
