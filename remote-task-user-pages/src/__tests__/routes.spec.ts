import { describe, expect, it, vi } from 'vitest'
import { createRemoteTaskUserRoutes } from '../routes'
import type { RemoteTaskUserFacade } from '../facade'

const facade: RemoteTaskUserFacade = {
  listConnectors: vi.fn(async () => ({ connectors: [] })),
  getConnector: vi.fn(async () => ({ id: 'conn_1' })),
  listConnections: vi.fn(async () => ({ connections: [] })),
  createConnection: vi.fn(async () => ({ id: 'created_1' })),
  getConnection: vi.fn(async () => ({ id: 'connection_1' })),
  getConnectionAction: vi.fn(async () => ({ action_key: 'sync_transform' })),
  executeConnectionAction: vi.fn(async () => ({ execution_id: 'exec_1' })),
  deleteConnection: vi.fn(async () => ({})),
  reauthConnection: vi.fn(async () => ({})),
  listTasks: vi.fn(async () => ({ executions: [] })),
  getTask: vi.fn(async () => ({ id: 'task_1' })),
  cancelTask: vi.fn(async () => ({})),
  deleteTask: vi.fn(async () => ({})),
}

const authTaskFacade = {
  getTask: vi.fn(),
  submitTask: vi.fn(),
  completeCallback: vi.fn(),
}

describe('createRemoteTaskUserRoutes', () => {
  it('creates the full bundle route set', () => {
    const routes = createRemoteTaskUserRoutes({
      basePath: 'integrations',
      routePrefix: 'team-remote-task',
      facade,
      authTaskFacade,
    })

    expect(routes).toHaveLength(1)
    expect(routes[0]?.path).toBe('integrations')
    const children = routes[0]?.children ?? []
    expect(children.map(route => route.name)).toEqual([
      'team-remote-task-index',
      'team-remote-task-connectors',
      'team-remote-task-connector-detail',
      'team-remote-task-connect',
      'team-remote-task-connections',
      'team-remote-task-connection-detail',
      'team-remote-task-tasks',
      'team-remote-task-task-detail',
    ])
  })
})
