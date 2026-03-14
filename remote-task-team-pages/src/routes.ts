import { RouterView, type RouteRecordRaw } from 'vue-router'
import { defineComponent, h, provide } from 'vue'
import {
  defaultTranslate,
  teamConnectorWorkbenchRuntimeKey,
  type TeamConnectorWorkbenchFacade,
  type TeamConnectorWorkbenchTranslate,
} from './facade'
import WorkbenchPage from './pages/WorkbenchPage.vue'
import DiscoverableCatalogPage from './pages/DiscoverableCatalogPage.vue'
import DiscoverableDetailPage from './pages/DiscoverableDetailPage.vue'
import ConnectPage from './pages/ConnectPage.vue'

export interface CreateTeamConnectorWorkbenchRoutesOptions {
  basePath: string
  routePrefix: string
  facade: TeamConnectorWorkbenchFacade
  t?: TeamConnectorWorkbenchTranslate
}

function createShell(facade: TeamConnectorWorkbenchFacade, routePrefix: string, t?: TeamConnectorWorkbenchTranslate) {
  return defineComponent({
    name: 'TeamConnectorWorkbenchShell',
    setup() {
      provide(teamConnectorWorkbenchRuntimeKey, {
        facade,
        routePrefix,
        t: t ?? defaultTranslate,
      })
      return () => h(RouterView)
    },
  })
}

function detailRedirect(prefix: string, to: any) {
  const connectorId = typeof to.query.connector_id === 'string'
    ? to.query.connector_id
    : typeof to.params.pkgId === 'string'
      ? to.params.pkgId
      : undefined
  if (!connectorId) return { name: `${prefix}-workbench` }
  return { name: `${prefix}-discoverable-detail`, params: { connectorId } }
}

export function createTeamConnectorWorkbenchRoutes(options: CreateTeamConnectorWorkbenchRoutesOptions): RouteRecordRaw[] {
  const prefix = options.routePrefix
  return [
    {
      path: options.basePath,
      component: createShell(options.facade, prefix, options.t),
      children: [
        { path: '', name: `${prefix}-workbench`, component: WorkbenchPage },
        { path: 'all', name: `${prefix}-catalog`, component: DiscoverableCatalogPage },
        { path: 'packages', redirect: { name: `${prefix}-workbench` } },
        { path: 'packages/:pkgId', redirect: to => detailRedirect(prefix, to) },
        { path: 'publish', redirect: { name: `${prefix}-workbench` } },
        { path: 'deploy', redirect: { name: `${prefix}-workbench` } },
        { path: 'rollback', redirect: { name: `${prefix}-workbench` } },
        { path: 'config', redirect: { name: `${prefix}-workbench` } },
        { path: 'instances', redirect: { name: `${prefix}-workbench` } },
        { path: 'instances/:instanceId', redirect: { name: `${prefix}-workbench` } },
        { path: 'shared-connections', redirect: to => detailRedirect(prefix, to) },
        { path: ':connectorId/connect', name: `${prefix}-connect`, component: ConnectPage },
        { path: ':connectorId', name: `${prefix}-discoverable-detail`, component: DiscoverableDetailPage },
      ],
    },
  ]
}
