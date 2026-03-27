import { RouterView, type RouteComponent, type RouteRecordRaw } from 'vue-router'
import { defineComponent, h } from 'vue'

import type { ConnectorDomainRouteOptions } from './types'

function createIndexComponent(options: ConnectorDomainRouteOptions) {
  return defineComponent({
    name: 'ConnectorDomainIndexHost',
    setup() {
      return () => h(options.indexComponent as never, options.indexProps ?? {})
    },
  })
}

function createShell(name: string) {
  return defineComponent({
    name,
    setup() {
      return () => h(RouterView)
    },
  })
}

function createSinglePageRoute(path: string, name: string, component?: RouteComponent): RouteRecordRaw | null {
  if (!component) return null
  return { path, name, component }
}

export function createConnectorDomainRoutes(options: ConnectorDomainRouteOptions): RouteRecordRaw[] {
  const groupedChildren: RouteRecordRaw[] = [
    {
      path: 'connections',
      component: createShell('ConnectorDomainConnectionsShell'),
      children: options.connectionsChildren ?? [],
    },
    {
      path: 'catalog',
      component: createShell('ConnectorDomainCatalogShell'),
      children: options.catalogChildren ?? [],
    },
    {
      path: 'packages',
      component: createShell('ConnectorDomainPackagesShell'),
      children: options.packagesChildren ?? [],
    },
    {
      path: 'instances',
      component: createShell('ConnectorDomainInstancesShell'),
      children: options.instancesChildren ?? [],
    },
  ].filter((route) => (route.children?.length ?? 0) > 0)

  const pageChildren = [
    createSinglePageRoute('publish', `${options.routePrefix}-publish`, options.publishComponent),
    createSinglePageRoute('deploy', `${options.routePrefix}-deploy`, options.deployComponent),
    createSinglePageRoute('rollback', `${options.routePrefix}-rollback`, options.rollbackComponent),
    createSinglePageRoute('config', `${options.routePrefix}-config`, options.configComponent),
  ].filter((route): route is RouteRecordRaw => route !== null)

  return [
    {
      path: options.basePath,
      component: options.shellComponent ?? createShell('ConnectorDomainRootShell'),
      children: [
        {
          path: '',
          name: `${options.routePrefix}-index`,
          component: createIndexComponent(options),
        },
        ...groupedChildren,
        ...pageChildren,
        ...(options.extraChildren ?? []),
      ],
    },
  ]
}
