import { RouterView, type RouteRecordRaw } from 'vue-router'
import { defineComponent, h, provide } from 'vue'
import {
  defaultTranslate,
  remoteTaskManagementRuntimeKey,
  type RemoteTaskManagementFacade,
  type RemoteTaskManagementScope,
  type RemoteTaskManagementTranslate,
} from './facade'
import DashboardPage from './pages/DashboardPage.vue'
import PackagesPage from './pages/PackagesPage.vue'
import PackageDetailPage from './pages/PackageDetailPage.vue'
import InstancesPage from './pages/InstancesPage.vue'
import InstanceDetailPage from './pages/InstanceDetailPage.vue'
import PendingInstancesPage from './pages/PendingInstancesPage.vue'
import PublishPage from './pages/PublishPage.vue'
import DeployPage from './pages/DeployPage.vue'
import RollbackPage from './pages/RollbackPage.vue'
import ConfigPage from './pages/ConfigPage.vue'

export interface CreateRemoteTaskManagementRoutesOptions {
  scope: RemoteTaskManagementScope
  basePath: string
  routePrefix: string
  sharedConnectionRoutePrefix?: string
  facade: RemoteTaskManagementFacade
  t?: RemoteTaskManagementTranslate
}

function createShell(
  facade: RemoteTaskManagementFacade,
  scope: RemoteTaskManagementScope,
  routePrefix: string,
  sharedConnectionRoutePrefix: string | undefined,
  t?: RemoteTaskManagementTranslate,
) {
  return defineComponent({
    name: 'RemoteTaskManagementShell',
    setup() {
      provide(remoteTaskManagementRuntimeKey, {
        facade,
        scope,
        routePrefix,
        sharedConnectionRoutePrefix,
        t: t ?? defaultTranslate,
      })
      return () => h(RouterView)
    },
  })
}

export function createRemoteTaskManagementRoutes(options: CreateRemoteTaskManagementRoutesOptions): RouteRecordRaw[] {
  const prefix = options.routePrefix
  const children: RouteRecordRaw[] = [
    { path: '', name: `${prefix}-dashboard`, component: DashboardPage },
    { path: 'packages', name: `${prefix}-packages`, component: PackagesPage },
    { path: 'packages/:pkgId', name: `${prefix}-package-detail`, component: PackageDetailPage },
    { path: 'instances', name: `${prefix}-instances`, component: InstancesPage },
    { path: 'instances/:instanceId', name: `${prefix}-instance-detail`, component: InstanceDetailPage },
    { path: 'publish', name: `${prefix}-publish`, component: PublishPage },
    { path: 'deploy', name: `${prefix}-deploy`, component: DeployPage },
    { path: 'rollback', name: `${prefix}-rollback`, component: RollbackPage },
    { path: 'config', name: `${prefix}-config`, component: ConfigPage },
  ]
  if (options.scope !== 'team') {
    children.splice(4, 0, {
      path: 'instances/pending',
      name: `${prefix}-instances-pending`,
      component: PendingInstancesPage,
    })
  }

  return [
    {
      path: options.basePath,
      component: createShell(options.facade, options.scope, prefix, options.sharedConnectionRoutePrefix, options.t),
      children,
    },
  ]
}
