import { describe, expect, it } from 'vitest'
import { createConnectorDomainRoutes } from '../index'

describe('remote-task-connector-domain-pages package', () => {
  it('exports the connector-domain route factory', () => {
    expect(typeof createConnectorDomainRoutes).toBe('function')
  })
})
