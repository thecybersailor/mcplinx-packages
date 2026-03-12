import { describe, expect, it } from 'vitest'
import { buildCliLoginUrl } from '../web-urls.js'

describe('buildCliLoginUrl', () => {
  it('builds www + /my/cli-login url', () => {
    const url = buildCliLoginUrl({
      webBaseUrl: 'https://www.mcplinx.com',
      sessionId: 'sess_123',
      apiBaseUrl: 'https://api.mcplinx.com',
    })
    expect(url).toBe(
      'https://www.mcplinx.com/my/cli-login?cli_session=sess_123&host=https%3A%2F%2Fapi.mcplinx.com',
    )
  })
})
