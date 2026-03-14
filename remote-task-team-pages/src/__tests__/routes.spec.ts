import { describe, expect, it, vi } from 'vitest'
import { createTeamConnectorWorkbenchRoutes } from '../routes'
import type { TeamConnectorWorkbenchFacade } from '../facade'

const facade: TeamConnectorWorkbenchFacade = {
  getWorkbench: vi.fn(async () => ({ available_connectors: [], discoverable_connectors: [] })),
  getConnectorDetail: vi.fn(async () => ({ connector_id: 'notion', status: 'discoverable' })),
  createConnection: vi.fn(async () => ({ id: 'connection_1' })),
}

describe('createTeamConnectorWorkbenchRoutes', () => {
  it('creates the team workbench route set', () => {
    const routes = createTeamConnectorWorkbenchRoutes({
      basePath: 'connectors',
      routePrefix: 'team-connectors',
      facade,
    })

    expect(routes).toHaveLength(1)
    expect(routes[0]?.path).toBe('connectors')
    const children = routes[0]?.children ?? []
    expect(children.map(route => route.name ?? route.path)).toContain('team-connectors-workbench')
    expect(children.map(route => route.name ?? route.path)).toContain('team-connectors-catalog')
    expect(children.map(route => route.name ?? route.path)).toContain('team-connectors-connect')
    expect(children.map(route => route.name ?? route.path)).toContain('team-connectors-discoverable-detail')
  })
})
