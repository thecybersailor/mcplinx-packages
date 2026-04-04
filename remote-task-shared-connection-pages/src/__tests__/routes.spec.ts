import { describe, expect, it, vi } from 'vitest'
import { createRemoteTaskSharedConnectionRoutes } from '../routes'
import type { RemoteTaskSharedConnectionFacade } from '../facade'

const CONNECTOR_UUID = 'bd8f5828-62f4-5066-8893-d46ecd02a5c2'

const facade: RemoteTaskSharedConnectionFacade = {
  listConnections: vi.fn(async () => ({ items: [] })),
  createConnection: vi.fn(async () => ({ id: 'shared_1' })),
  createAuthTask: vi.fn(async () => ({ task_id: 'cauth_1', auth_url: 'https://app.example/auth/connection-tasks/cauth_1' })),
  startAuth: vi.fn(async () => ({ connection_id: 'shared_1', fields: [] })),
  submitAuth: vi.fn(async () => ({ id: 'shared_1' })),
  getConnection: vi.fn(async () => ({ id: 'shared_1' })),
  getConnectionAction: vi.fn(async () => ({ action_key: 'sync_transform' })),
  executeConnectionAction: vi.fn(async () => ({ execution_id: 'exec_1' })),
  updateConnection: vi.fn(async () => ({ id: 'shared_1' })),
  deleteConnection: vi.fn(async () => ({})),
  reauthConnection: vi.fn(async () => ({ connection_id: 'shared_1', fields: [] })),
  explainFallback: vi.fn(async () => ({ connector_id: CONNECTOR_UUID, candidates: [] })),
}

describe('createRemoteTaskSharedConnectionRoutes', () => {
  it('creates list, create, detail and fallback routes', () => {
    const routes = createRemoteTaskSharedConnectionRoutes({
      scope: 'tenant',
      basePath: 'shared-connections',
      routePrefix: 'tenant-shared-connections',
      facade,
      authTaskFacade: {
        getTask: vi.fn(),
        submitTask: vi.fn(),
        completeCallback: vi.fn(),
      },
    })

    expect(routes).toHaveLength(1)
    expect(routes[0]?.path).toBe('shared-connections')
    const children = routes[0]?.children ?? []
    expect(children.map((route) => route.name)).toEqual([
      'tenant-shared-connections-index',
      'tenant-shared-connections-connections',
      'tenant-shared-connections-create',
      'tenant-shared-connections-detail',
      'tenant-shared-connections-fallback-explain',
    ])
  })
})
