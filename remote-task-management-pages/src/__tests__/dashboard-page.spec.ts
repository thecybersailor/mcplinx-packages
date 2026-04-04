import { describe, expect, it } from 'vitest'
import {
  remoteTaskManagementPageTestId,
  type RemoteTaskManagementRuntime,
} from '../facade'

const baseRuntime: RemoteTaskManagementRuntime = {
  facade: {} as never,
  scope: 'team',
  routePrefix: 'connectors',
  sharedConnectionRoutePrefix: 'connectors-shared-connections',
  t: (_key, fallback) => fallback,
}

describe('remoteTaskManagementPageTestId', () => {
  it('uses team test-id prefix for team surfaces', () => {
    expect(remoteTaskManagementPageTestId(baseRuntime, 'instances')).toBe('remote-task-management.instances.page')
  })

  it('uses admin test-id prefix for non-team surfaces', () => {
    const runtime = { ...baseRuntime, scope: 'tenant' as const }

    expect(remoteTaskManagementPageTestId(runtime, 'instances')).toBe('remote-task-admin.instances.page')
  })
})
