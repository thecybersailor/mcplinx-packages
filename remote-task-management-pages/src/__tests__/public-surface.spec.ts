import { describe, expect, it } from 'vitest'
import { defaultTranslate, interpolateRemoteTaskPlaceholders } from '../facade'

describe('remote-task-management-pages public surface', () => {
  it('does not export legacy dashboard route factory', async () => {
    const mod = await import('../index')

    expect('createRemoteTaskManagementRoutes' in mod).toBe(false)
  })

  it('interpolates {named} placeholders for host i18n fallbacks', () => {
    expect(interpolateRemoteTaskPlaceholders('Package: {id}', { id: 'pkg-1' })).toBe('Package: pkg-1')
    expect(interpolateRemoteTaskPlaceholders('{count} tools', { count: 3 })).toBe('3 tools')
    expect(defaultTranslate('k', 'Hello {name}', { name: 'x' })).toBe('Hello x')
  })
})
