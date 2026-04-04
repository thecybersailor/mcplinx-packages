import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { createConnectionAuthTaskRoutes } from '../routes'
import type { ConnectionAuthTaskFacade } from '../facade'

async function mountAt(path: string, facade: ConnectionAuthTaskFacade) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: createConnectionAuthTaskRoutes({
      basePath: '/auth/connection-tasks',
      routePrefix: 'auth-connection-tasks',
      facade,
    }),
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(defineComponent(() => () => h(RouterView)), {
    global: {
      plugins: [router],
    },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('AuthTaskCallbackPage', () => {
  it('posts callback payload and lands on success page', async () => {
    window.history.replaceState({}, '', '/auth/connection-tasks/cauth_1/callback?code=ok#state=1')
    const facade: ConnectionAuthTaskFacade = {
      getTask: vi.fn(async () => ({ task_id: 'cauth_1', status: 'succeeded' })),
      submitTask: vi.fn(),
      completeCallback: vi.fn(async (_taskId, request) => {
        expect(request.query).toEqual({ code: 'ok' })
        expect(request.hash).toBe('#state=1')
        expect(request.full_url).toContain('/callback?code=ok')
        return { task_id: 'cauth_1', status: 'succeeded' }
      }),
    }

    const { router } = await mountAt('/auth/connection-tasks/cauth_1/callback?code=ok', facade)
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('auth-connection-tasks-success')
  })
})
