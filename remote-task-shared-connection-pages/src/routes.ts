import { RouterView, type RouteRecordRaw } from 'vue-router'
import { defineComponent, h, provide } from 'vue'
import {
  defaultTranslate,
  remoteTaskSharedConnectionRuntimeKey,
  type RemoteTaskSharedConnectionFacade,
  type RemoteTaskSharedConnectionTranslate,
  type SharedConnectionScope,
} from './facade'
import ConnectionsPage from './pages/ConnectionsPage.vue'
import ConnectionDetailPage from './pages/ConnectionDetailPage.vue'
import CreateConnectionPage from './pages/CreateConnectionPage.vue'
import FallbackExplainPage from './pages/FallbackExplainPage.vue'

export interface CreateRemoteTaskSharedConnectionRoutesOptions {
  scope: SharedConnectionScope
  basePath: string
  routePrefix: string
  facade: RemoteTaskSharedConnectionFacade
  t?: RemoteTaskSharedConnectionTranslate
}

function createShell(
  facade: RemoteTaskSharedConnectionFacade,
  scope: SharedConnectionScope,
  routePrefix: string,
  t?: RemoteTaskSharedConnectionTranslate,
) {
  return defineComponent({
    name: 'RemoteTaskSharedConnectionShell',
    setup() {
      provide(remoteTaskSharedConnectionRuntimeKey, {
        facade,
        scope,
        routePrefix,
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
  return [
    {
      path: options.basePath,
      component: createShell(options.facade, options.scope, prefix, options.t),
      children: [
        { path: '', name: `${prefix}-index`, redirect: { name: `${prefix}-connections` } },
        { path: 'connections', name: `${prefix}-connections`, component: ConnectionsPage },
        { path: 'connections/new', name: `${prefix}-create`, component: CreateConnectionPage },
        { path: 'connections/:id', name: `${prefix}-detail`, component: ConnectionDetailPage },
        { path: 'fallback-explain', name: `${prefix}-fallback-explain`, component: FallbackExplainPage },
      ],
    },
  ]
}
