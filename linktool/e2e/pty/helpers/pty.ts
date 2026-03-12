import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export type PtyProc = {
  write: (s: string) => void
  kill: () => void
  waitFor: (re: RegExp, timeoutMs?: number) => Promise<string>
  waitForAny: (res: RegExp[], timeoutMs?: number) => Promise<{ idx: number; text: string }>
  output: () => string
}

export function spawnPty(cmd: string, args: string[], opts: { cwd: string; env?: Record<string, string> }): PtyProc {
  const proxy = fileURLToPath(new URL('./pty_proxy.py', import.meta.url))
  const child: ChildProcessWithoutNullStreams = spawn(
    'python3',
    [proxy, '--cwd', opts.cwd, '--', cmd, ...args],
    {
      cwd: opts.cwd,
      env: { ...process.env, ...(opts.env || {}) },
      stdio: 'pipe',
    },
  )

  let buf = ''
  let exitInfo: { code: number | null; signal: NodeJS.Signals | null } | null = null
  let spawnError: unknown = null
  child.stdout.on('data', (d) => {
    buf += d.toString('utf8')
  })
  child.stderr.on('data', (d) => {
    buf += d.toString('utf8')
  })
  child.on('exit', (code, signal) => {
    exitInfo = { code, signal }
  })
  child.on('error', (err) => {
    spawnError = err
  })

  function waitFor(re: RegExp, timeoutMs = 30_000): Promise<string> {
    const start = Date.now()
    return new Promise((resolve, reject) => {
      const tick = () => {
        if (re.test(buf)) return resolve(buf)
        if (spawnError) {
          return reject(new Error(`spawn error: ${String((spawnError as any)?.message || spawnError)}\n\nOUTPUT:\n${buf}`))
        }
        if (exitInfo) {
          return reject(
            new Error(
              `process exited before matching ${re} (code=${exitInfo.code} signal=${exitInfo.signal})\n\nOUTPUT:\n${buf}`,
            ),
          )
        }
        if (Date.now() - start > timeoutMs) return reject(new Error(`timeout waiting for ${re}\n\nOUTPUT:\n${buf}`))
        setTimeout(tick, 50)
      }
      tick()
    })
  }

  function waitForAny(res: RegExp[], timeoutMs = 30_000): Promise<{ idx: number; text: string }> {
    const start = Date.now()
    return new Promise((resolve, reject) => {
      const tick = () => {
        for (let i = 0; i < res.length; i++) {
          if (res[i].test(buf)) return resolve({ idx: i, text: buf })
        }
        if (spawnError) {
          return reject(new Error(`spawn error: ${String((spawnError as any)?.message || spawnError)}\n\nOUTPUT:\n${buf}`))
        }
        if (exitInfo) {
          return reject(
            new Error(
              `process exited before matching any (code=${exitInfo.code} signal=${exitInfo.signal})\n\nOUTPUT:\n${buf}`,
            ),
          )
        }
        if (Date.now() - start > timeoutMs) {
          return reject(new Error(`timeout waiting for any: ${res.map(String).join(', ')}\n\nOUTPUT:\n${buf}`))
        }
        setTimeout(tick, 50)
      }
      tick()
    })
  }

  return {
    write: (s) => child.stdin.write(s),
    kill: () => child.kill('SIGKILL'),
    waitFor,
    waitForAny,
    output: () => buf,
  }
}
