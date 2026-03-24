import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { spawnPty } from './helpers/pty'
import { resolveRepoLayout } from './helpers/repo-layout'

function mkTempDir(prefix: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

const repoLayout = resolveRepoLayout()
const canRunLocalIssuer = process.env.MCPLINX_E2E_EXTERNAL === '1' || !!repoLayout?.localIssuerEntrypoint
const d = repoLayout && canRunLocalIssuer ? describe : describe.skip

function startLocalIssuer() {
  if (process.env.MCPLINX_E2E_EXTERNAL === '1') {
    return null
  }
  if (!repoLayout?.localIssuerEntrypoint) {
    return null
  }
  const proc = spawn('npx', ['tsx', repoLayout.localIssuerEntrypoint], {
    cwd: repoLayout.root,
    env: { ...process.env, LOCAL_ISSUER_PORT: '16901', LOCAL_ISSUER_HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return proc
}

d('linktool login/whoami/logout (pty)', () => {
  const procs: Array<() => void> = []
  afterEach(() => {
    for (const stop of procs.splice(0)) stop()
  })

  it('can login locally via TTY and persist creds', async () => {
    const issuer = startLocalIssuer()
    if (issuer) procs.push(() => issuer.kill('SIGKILL'))

    const linktoolHome = mkTempDir('linktool-home-')
    procs.push(() => fs.rmSync(linktoolHome, { recursive: true, force: true }))

    if (!repoLayout) {
      throw new Error('repo layout not found')
    }
    const root = repoLayout.root
    const issuerUrl = process.env.MCPLINX_LOCAL_ISSUER_URL || 'http://127.0.0.1:16901'
    const apiBaseUrl = process.env.MCPLINX_API_BASE_URL || 'http://127.0.0.1:16089'
    const env = {
      LINKTOOL_HOME: linktoolHome,
      LINKTOOL_AUTH_MODE: 'local',
      MCPLINX_LOCAL_ISSUER_URL: issuerUrl,
      MCPLINX_API_BASE_URL: apiBaseUrl,
    }

    const p = spawnPty('/usr/bin/env', ['npx', 'tsx', repoLayout.linktoolEntrypoint, 'login'], {
      cwd: root,
      env,
    })
    procs.push(() => p.kill())

    await p.waitFor(/Email/i, 30_000)
    p.write('dev@example.com\r')
    await p.waitFor(/Logged in successfully/i, 30_000)
    expect(fs.existsSync(path.join(linktoolHome, '.syntool', 'credentials.json'))).toBe(true)
    expect(fs.existsSync(path.join(linktoolHome, '.linktool', 'credentials.json'))).toBe(false)

    const who = spawnPty('/usr/bin/env', ['npx', 'tsx', repoLayout.linktoolEntrypoint, 'whoami'], {
      cwd: root,
      env,
    })
    procs.push(() => who.kill())
    await who.waitFor(/Logged in as/i, 10_000)
    expect(who.output()).toContain('dev@example.com')

    const out = spawnPty('/usr/bin/env', ['npx', 'tsx', repoLayout.linktoolEntrypoint, 'logout'], {
      cwd: root,
      env,
    })
    procs.push(() => out.kill())
    await out.waitFor(/Logged out successfully/i, 10_000)
  }, 60_000)
})
