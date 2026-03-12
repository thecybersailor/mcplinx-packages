import { RouterView, type RouteRecordRaw } from 'vue-router'
import { defineComponent, h, provide } from 'vue'
import {
  defaultTranslate,
  remoteTaskUserRuntimeKey,
  type RemoteTaskUserFacade,
  type RemoteTaskUserTranslate,
} from './facade'
import ConnectorsPage from './pages/ConnectorsPage.vue'
import ConnectorDetailPage from './pages/ConnectorDetailPage.vue'
import ConnectPage from './pages/ConnectPage.vue'
import ConnectionsPage from './pages/ConnectionsPage.vue'
import ConnectionDetailPage from './pages/ConnectionDetailPage.vue'
import TasksPage from './pages/TasksPage.vue'
import TaskDetailPage from './pages/TaskDetailPage.vue'

export interface CreateRemoteTaskUserRoutesOptions {
  basePath: string
  routePrefix: string
  facade: RemoteTaskUserFacade
  t?: RemoteTaskUserTranslate
}

function createShell(facade: RemoteTaskUserFacade, routePrefix: string, t?: RemoteTaskUserTranslate) {
  return defineComponent({
    name: 'RemoteTaskUserShell',
    setup() {
      provide(remoteTaskUserRuntimeKey, {
        facade,
        routePrefix,
        t: t ?? defaultTranslate,
      })
      return () => h(RouterView)
    },
  })
}

export function createRemoteTaskUserRoutes(options: CreateRemoteTaskUserRoutesOptions): RouteRecordRaw[] {
  const prefix = options.routePrefix
  return [
    {
      path: options.basePath,
      component: createShell(options.facade, prefix, options.t),
      children: [
        { path: '', name: `${prefix}-index`, redirect: { name: `${prefix}-connections` } },
        { path: 'connectors', name: `${prefix}-connectors`, component: ConnectorsPage },
        { path: 'connectors/:id', name: `${prefix}-connector-detail`, component: ConnectorDetailPage },
        { path: 'connectors/:id/connect', name: `${prefix}-connect`, component: ConnectPage },
        { path: 'connections', name: `${prefix}-connections`, component: ConnectionsPage },
        { path: 'connections/:id', name: `${prefix}-connection-detail`, component: ConnectionDetailPage },
        { path: 'tasks', name: `${prefix}-tasks`, component: TasksPage },
        { path: 'tasks/:id', name: `${prefix}-task-detail`, component: TaskDetailPage },
      ],
    },
  ]
}
