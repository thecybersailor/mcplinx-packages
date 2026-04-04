import { RouterView, type RouteRecordRaw } from 'vue-router'
import { defineComponent, h, provide } from 'vue'
import {
  connectionAuthTaskRuntimeKey,
  defaultTranslate,
  type ConnectionAuthTaskFacade,
  type ConnectionAuthTaskTranslate,
} from './facade'
import AuthTaskPage from './pages/AuthTaskPage.vue'
import AuthTaskCallbackPage from './pages/AuthTaskCallbackPage.vue'
import AuthTaskSuccessPage from './pages/AuthTaskSuccessPage.vue'

export interface CreateConnectionAuthTaskRoutesOptions {
  basePath: string
  routePrefix: string
  facade: ConnectionAuthTaskFacade
  t?: ConnectionAuthTaskTranslate
}

function createShell(
  facade: ConnectionAuthTaskFacade,
  routePrefix: string,
  t?: ConnectionAuthTaskTranslate,
) {
  return defineComponent({
    name: 'ConnectionAuthTaskShell',
    setup() {
      provide(connectionAuthTaskRuntimeKey, {
        facade,
        routePrefix,
        t: t ?? defaultTranslate,
      })
      return () => h(RouterView)
    },
  })
}

export function createConnectionAuthTaskRoutes(
  options: CreateConnectionAuthTaskRoutesOptions,
): RouteRecordRaw[] {
  const prefix = options.routePrefix
  return [
    {
      path: options.basePath,
      component: createShell(options.facade, prefix, options.t),
      children: [
        { path: ':taskId', name: `${prefix}-detail`, component: AuthTaskPage },
        { path: ':taskId/callback', name: `${prefix}-callback`, component: AuthTaskCallbackPage },
        { path: ':taskId/success', name: `${prefix}-success`, component: AuthTaskSuccessPage },
      ],
    },
  ]
}
