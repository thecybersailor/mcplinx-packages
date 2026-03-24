import { describe, expect, it, vi } from 'vitest'
import { createRemoteTaskManagementRoutes } from '../routes'
import type { RemoteTaskManagementFacade } from '../facade'

const facade: RemoteTaskManagementFacade = {
  listPackages: vi.fn(async () => []),
  getPackage: vi.fn(async () => ({ id: 1 })),
  listPackageVersions: vi.fn(async () => []),
  listPackageInstances: vi.fn(async () => []),
  listInstances: vi.fn(async () => []),
  getInstance: vi.fn(async () => ({ id: 1 })),
  reviewInstance: vi.fn(async () => ({})),
  createUploadUrls: vi.fn(async () => ({ upload_urls: {} })),
  publish: vi.fn(async () => ({})),
  deploy: vi.fn(async () => ({ message: 'ok' })),
  rollback: vi.fn(async () => ({ message: 'ok' })),
  listConfigs: vi.fn(async () => []),
  getConfig: vi.fn(async () => ({ id: 'cfg_1' })),
  updateConfig: vi.fn(async () => ({ id: 'cfg_1' })),
}

describe('createRemoteTaskManagementRoutes', () => {
  it('creates moderation routes for platform scope', () => {
    const routes = createRemoteTaskManagementRoutes({
      scope: 'platform',
      basePath: 'connectors',
      routePrefix: 'platform-remote-task',
      facade,
    })

    expect(routes).toHaveLength(1)
    expect(routes[0]?.path).toBe('connectors')
    const children = routes[0]?.children ?? []
    expect(children.map(route => route.name)).toEqual([
      'platform-remote-task-dashboard',
      'platform-remote-task-packages',
      'platform-remote-task-package-detail',
      'platform-remote-task-instances',
      'platform-remote-task-instances-pending',
      'platform-remote-task-instance-detail',
      'platform-remote-task-publish',
      'platform-remote-task-deploy',
      'platform-remote-task-rollback',
      'platform-remote-task-config',
    ])
  })

  it('does not register pending review routes for team scope', () => {
    const routes = createRemoteTaskManagementRoutes({
      scope: 'team',
      basePath: 'settings/integrations',
      routePrefix: 'team-settings-integrations-team',
      facade: {
        ...facade,
        reviewInstance: undefined,
      },
    })

    const children = routes[0]?.children ?? []
    expect(children.map(route => route.name)).not.toContain('team-settings-integrations-team-instances-pending')
  })
})
