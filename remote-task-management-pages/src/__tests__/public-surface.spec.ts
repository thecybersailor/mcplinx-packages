import { describe, expect, it } from 'vitest'

describe('remote-task-management-pages public surface', () => {
  it('does not export legacy dashboard route factory', async () => {
    const mod = await import('../index')

    expect('createRemoteTaskManagementRoutes' in mod).toBe(false)
  })
})
