import { RouterView, type RouteLocationRaw, type RouteRecordRaw } from 'vue-router'
import { defineComponent, h, provide } from 'vue'
import {
  defaultTranslate,
  remoteTaskSharedConnectionRuntimeKey,
  type RemoteTaskSharedConnectionFacade,
  type RemoteTaskSharedConnectionTranslate,
  type SharedConnectionScope,
} from './facade'
import type { ConnectionAuthTaskFacade } from '../../remote-task-connection-auth-pages/src/facade'
import ConnectionsPage from './pages/ConnectionsPage.vue'
import ConnectionDetailPage from './pages/ConnectionDetailPage.vue'
import CreateConnectionPage from './pages/CreateConnectionPage.vue'
import FallbackExplainPage from './pages/FallbackExplainPage.vue'

export interface CreateRemoteTaskSharedConnectionRoutesOptions {
  scope: SharedConnectionScope
  basePath: string
  routePrefix: string
  facade: RemoteTaskSharedConnectionFacade
  authTaskFacade: ConnectionAuthTaskFacade
  connectAppTarget?: (connectorId?: string) => RouteLocationRaw
  taskDetailTarget?: (executionId: string) => RouteLocationRaw
  includeFallbackExplain?: boolean
  t?: RemoteTaskSharedConnectionTranslate
}

function createShell(
  facade: RemoteTaskSharedConnectionFacade,
  authTaskFacade: ConnectionAuthTaskFacade,
  scope: SharedConnectionScope,
  routePrefix: string,
  connectAppTarget: ((connectorId?: string) => RouteLocationRaw) | undefined,
  taskDetailTarget: ((executionId: string) => RouteLocationRaw) | undefined,
  t?: RemoteTaskSharedConnectionTranslate,
) {
  return defineComponent({
    name: 'RemoteTaskSharedConnectionShell',
    setup() {
      provide(remoteTaskSharedConnectionRuntimeKey, {
        facade,
        authTaskFacade,
        scope,
        routePrefix,
        connectAppTarget,
        taskDetailTarget,
        t: t ?? defaultTranslate,
      })
      return () => h(RouterView)
    },
  })
}

export function createRemoteTaskSharedConnectionRoutes(
  options: CreateRemoteTaskSharedConnectionRoutesOptions,
): RouteRecordRaw[] {
  const prefix = options.routePrefix
  const children: RouteRecordRaw[] = [
    { path: '', name: `${prefix}-index`, redirect: { name: `${prefix}-connections` } },
    { path: 'connections', name: `${prefix}-connections`, component: ConnectionsPage },
    { path: 'connections/new', name: `${prefix}-create`, component: CreateConnectionPage },
    { path: 'connections/:id', name: `${prefix}-detail`, component: ConnectionDetailPage },
  ]
  if (options.includeFallbackExplain !== false) {
    children.push({ path: 'fallback-explain', name: `${prefix}-fallback-explain`, component: FallbackExplainPage })
  }
  return [
    {
      path: options.basePath,
      component: createShell(
        options.facade,
        options.authTaskFacade,
        options.scope,
        prefix,
        options.connectAppTarget,
        options.taskDetailTarget,
        options.t,
      ),
      children,
    },
  ]
}
