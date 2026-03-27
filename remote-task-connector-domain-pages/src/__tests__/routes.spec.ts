import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { createConnectorDomainRoutes } from '../routes'

const Stub = defineComponent({ template: '<div />' })

describe('createConnectorDomainRoutes', () => {
  it('creates a shared top-level connector domain route with host-supplied index component', () => {
    const [route] = createConnectorDomainRoutes({
      basePath: 'connectors',
      routePrefix: 'team-connectors',
      indexComponent: Stub,
      connectionsChildren: [{ path: '', name: 'team-connections-home', component: Stub }],
      catalogChildren: [{ path: '', name: 'team-catalog-home', component: Stub }],
      packagesChildren: [{ path: '', name: 'team-packages-home', component: Stub }],
      instancesChildren: [{ path: '', name: 'team-instances-home', component: Stub }],
      publishComponent: Stub,
      deployComponent: Stub,
      rollbackComponent: Stub,
      configComponent: Stub,
    })

    expect(route?.path).toBe('connectors')
    expect(route?.children?.map((child) => child.path)).toEqual([
      '',
      'connections',
      'catalog',
      'packages',
      'instances',
      'publish',
      'deploy',
      'rollback',
      'config',
    ])
    expect(route?.children?.[0]?.name).toBe('team-connectors-index')
    expect(route?.children?.[1]?.children?.map((child) => child.name)).toEqual(['team-connections-home'])
    expect(route?.children?.[4]?.children?.map((child) => child.name)).toEqual(['team-instances-home'])
  })

  it('allows host extensions such as pending review without introducing scope concepts into the package API', () => {
    const [route] = createConnectorDomainRoutes({
      basePath: 'connectors',
      routePrefix: 'admin-connectors',
      shellComponent: Stub,
      indexComponent: Stub,
      extraChildren: [{ path: 'instances/pending', name: 'admin-connectors-instances-pending', component: Stub }],
    })

    expect(route?.component).toBe(Stub)
    expect(route?.children?.map((child) => child.path)).toContain('instances/pending')
    expect(route?.children?.map((child) => child.name)).toContain('admin-connectors-instances-pending')
  })
})
