import { describe, expect, it, vi } from 'vitest'
import { createConnectionAuthTaskRoutes } from '../routes'
import type { ConnectionAuthTaskFacade } from '../facade'

const facade: ConnectionAuthTaskFacade = {
  getTask: vi.fn(async () => ({ task_id: 'cauth_1' })),
  submitTask: vi.fn(async () => ({ task_id: 'cauth_1', status: 'succeeded' })),
  completeCallback: vi.fn(async () => ({ task_id: 'cauth_1', status: 'succeeded' })),
}

describe('createConnectionAuthTaskRoutes', () => {
  it('creates detail callback and success routes', () => {
    const [route] = createConnectionAuthTaskRoutes({
      basePath: 'connection-tasks',
      routePrefix: 'auth-connection-tasks',
      facade,
    })

    expect(route?.path).toBe('connection-tasks')
    const children = route?.children ?? []
    expect(children.map((child) => child.name)).toEqual([
      'auth-connection-tasks-detail',
      'auth-connection-tasks-callback',
      'auth-connection-tasks-success',
    ])
  })
})
