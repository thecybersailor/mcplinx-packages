import { describe, expect, it } from 'vitest'
import { createLinktoolCoreContext } from '../core/types.js'

describe('linktool core boundary', () => {
  it('exports a stable runtime context contract', () => {
    const ctx = createLinktoolCoreContext({
      cwd: '/tmp/project',
      tunnelBaseUrl: 'https://tun.dev.example.com',
    })

    expect(ctx.cwd).toBe('/tmp/project')
    expect(ctx.tunnelBaseUrl).toBe('https://tun.dev.example.com')
  })
})
