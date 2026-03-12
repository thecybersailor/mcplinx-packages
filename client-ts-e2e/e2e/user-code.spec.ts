import { describe, expect, it } from 'vitest'
import { createApi } from '@mcplinx/api-client-user/wrapper'

async function issueToken(issuerBaseUrl: string, email: string): Promise<string> {
  const res = await fetch(`${issuerBaseUrl.replace(/\/$/, '')}/issue`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error(`issuer /issue failed: ${res.status}`)
  const body = (await res.json()) as any
  const token = String(body.access_token || '').trim()
  if (!token) throw new Error('missing access_token from issuer')
  return token
}

describe('client-ts user code e2e', () => {
  it('can call hub APIs using the public client wrapper', async () => {
    const apiBaseUrl = process.env.MCPLINX_API_BASE_URL || 'http://127.0.0.1:16089'
    const issuerBaseUrl = process.env.MCPLINX_LOCAL_ISSUER_URL || 'http://127.0.0.1:16901'

    const token = await issueToken(issuerBaseUrl, 'sdk@example.com')

    // 1) Direct endpoint sanity check (/v1/me) without relying on internal APIs.
    const meRes = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(meRes.status).toBe(200)
    const meBody = (await meRes.json()) as any
    expect(meBody?.data?.sub || meBody?.sub).toBeTruthy()

    // 2) Use the generated public SDK for user-app endpoints.
    const api = createApi({
      baseUrl: apiBaseUrl,
      securityWorker: async () => ({ headers: { Authorization: `Bearer ${token}` } }),
      baseApiParams: { headers: { 'Content-Type': 'application/json' } },
    })

    const connectors = await api.user.appConnectorsList({ limit: 1, offset: 0 })
    expect(connectors).toBeTruthy()

    const connections = await api.user.appConnectionsList()
    expect(connections).toBeTruthy()
  })
})

