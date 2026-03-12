import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { spawnPty } from './helpers/pty'
import { resolveRepoLayout } from './helpers/repo-layout'

function mkTempDir(prefix: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

const repoLayout = resolveRepoLayout()
const canRunLocalIssuer = process.env.MCPLINX_E2E_EXTERNAL === '1' || !!repoLayout?.localIssuerEntrypoint
const canRunSuite = !!repoLayout?.linktoolEntrypoint && !!repoLayout?.connectorExampleApiKeyDir && canRunLocalIssuer
const d = canRunSuite ? describe : describe.skip

function startLocalIssuer(root: string) {
  if (process.env.MCPLINX_E2E_EXTERNAL === '1') {
    return null
  }
  if (!repoLayout?.localIssuerEntrypoint) {
    return null
  }
  const proc = spawn('npx', ['tsx', repoLayout.localIssuerEntrypoint], {
    cwd: root,
    env: { ...process.env, LOCAL_ISSUER_PORT: '16901', LOCAL_ISSUER_HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return proc
}

function startMockApiKeyServer(port: number): Promise<http.Server | null> {
  if (process.env.MCPLINX_E2E_EXTERNAL === '1') {
    return Promise.resolve(null)
  }
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`)
    if (req.method === 'GET' && url.pathname === '/api-key/me') {
      const auth = req.headers['authorization'] || ''
      if (auth !== 'Bearer test_api_key_12345') {
        res.writeHead(401, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: 'unauthorized' }))
        return
      }
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ username: 'api_test_user' }))
      return
    }

    if (req.method === 'POST' && url.pathname === '/tasks/sync') {
      const auth = req.headers['authorization'] || ''
      if (auth !== 'Bearer test_api_key_12345') {
        res.writeHead(401, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: 'unauthorized' }))
        return
      }
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: true, echo: body ? JSON.parse(body) : null }))
      })
      return
    }

    res.writeHead(404, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: 'not_found' }))
  })

  return new Promise<http.Server>((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => resolve(server))
    server.on('error', reject)
  })
}

d('linktool api-key auth + run (pty)', () => {
  const stops: Array<() => void> = []
  afterEach(() => {
    for (const s of stops.splice(0)) s()
  })

  it('uses MOCK_BASE_URL and does not require mock.dev.mcplinx.com', async () => {
    if (!repoLayout) {
      throw new Error('repo layout not found')
    }
    const root = repoLayout.root
    const issuerUrl = process.env.MCPLINX_LOCAL_ISSUER_URL || 'http://127.0.0.1:16901'
    const apiBaseUrl = process.env.MCPLINX_API_BASE_URL || 'http://127.0.0.1:16089'
    const mockBaseUrl = process.env.MCPLINX_MOCK_BASE_URL || 'http://127.0.0.1:16887'
    const tunnelBaseUrl = process.env.MCPLINX_TUNNEL_BASE_URL || 'http://127.0.0.1:16888'

    const issuer = startLocalIssuer(root)
    if (issuer) stops.push(() => issuer.kill('SIGKILL'))

    const mock = await startMockApiKeyServer(16887)
    if (mock) stops.push(() => mock.close())

    const linktoolHome = mkTempDir('linktool-home-')
    stops.push(() => fs.rmSync(linktoolHome, { recursive: true, force: true }))

    // 1) Login (local mode)
    const login = spawnPty(
      '/usr/bin/env',
      ['npx', 'tsx', repoLayout.linktoolEntrypoint, 'login'],
      {
        cwd: root,
        env: {
          LINKTOOL_HOME: linktoolHome,
          LINKTOOL_AUTH_MODE: 'local',
          MCPLINX_LOCAL_ISSUER_URL: issuerUrl,
          MCPLINX_API_BASE_URL: apiBaseUrl,
        },
      },
    )
    stops.push(() => login.kill())
    await login.waitFor(/Email/i, 30_000)
    login.write('dev@example.com\r')
    await login.waitFor(/Logged in successfully/i, 30_000)

    // 2) Prepare connector workspace in temp dir
    const connectorSrc = repoLayout.connectorExampleApiKeyDir
    const connectorDir = mkTempDir('connector-api-key-')
    stops.push(() => fs.rmSync(connectorDir, { recursive: true, force: true }))
    fs.cpSync(connectorSrc, connectorDir, { recursive: true })

    fs.writeFileSync(
      path.join(connectorDir, '.config.yml'),
      `vars:\n  MOCK_BASE_URL: \"${mockBaseUrl}\"\n`,
      'utf8',
    )

    // 3) linktool test auth (form prompt)
    const auth = spawnPty(
      '/usr/bin/env',
      ['npx', 'tsx', repoLayout.linktoolEntrypoint, 'test', 'auth'],
      {
        cwd: connectorDir,
        env: {
          LINKTOOL_HOME: linktoolHome,
          MCPLINX_TUNNEL_BASE_URL: tunnelBaseUrl,
        },
      },
    )
    stops.push(() => auth.kill())
    await auth.waitFor(/API Key/i, 30_000)
    auth.write('test_api_key_12345\r')
    await auth.waitFor(/Authentication test passed/i, 30_000)
    await auth.waitFor(/Connection saved/i, 30_000)
    expect(auth.output()).not.toContain('mock.dev.mcplinx.com')

    // 4) linktool test run sync_task
    const run = spawnPty(
      '/usr/bin/env',
      [
        'npx',
        'tsx',
        repoLayout.linktoolEntrypoint,
        'test',
        'run',
        'sync_task',
        '-P',
        'input=hello',
      ],
      {
        cwd: connectorDir,
        env: {
          LINKTOOL_HOME: linktoolHome,
          MCPLINX_TUNNEL_BASE_URL: tunnelBaseUrl,
        },
      },
    )
    stops.push(() => run.kill())
    await run.waitFor(/✓ Result/i, 30_000)
    if (process.env.MCPLINX_E2E_EXTERNAL === '1') {
      // When running against the real mock-service-provider Worker, the example connector returns a rich result.
      expect(run.output()).toContain('"status": "completed"')
    } else {
      // When running against the local minimal mock server, it returns { ok: true }.
      expect(run.output()).toContain('"ok": true')
    }
    expect(run.output()).not.toContain('mock.dev.mcplinx.com')
  }, 90_000)
})
