import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createConnectionAuthTaskRoutes } from '../routes'
import type { ConnectionAuthTaskFacade } from '../facade'

const closeMocks = vi.hoisted(() => ({
  bestEffortCloseWindow: vi.fn(),
}))

vi.mock('../windowClose', () => ({
  bestEffortCloseWindow: closeMocks.bestEffortCloseWindow,
}))

class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = []

  name: string
  postMessage = vi.fn()
  close = vi.fn()

  constructor(name: string) {
    this.name = name
    FakeBroadcastChannel.instances.push(this)
  }
}

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

describe('AuthTaskSuccessPage', () => {
  const originalBroadcastChannel = globalThis.BroadcastChannel
  const openerPostMessage = vi.fn()

  beforeEach(() => {
    FakeBroadcastChannel.instances = []
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel as unknown as typeof BroadcastChannel)
    Object.defineProperty(window, 'opener', {
      configurable: true,
      value: {
        postMessage: openerPostMessage,
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    openerPostMessage.mockReset()
    closeMocks.bestEffortCloseWindow.mockReset()
    if (originalBroadcastChannel) {
      vi.stubGlobal('BroadcastChannel', originalBroadcastChannel)
    }
  })

  it('broadcasts terminal success to the source page', async () => {
    const facade: ConnectionAuthTaskFacade = {
      getTask: vi.fn(async () => ({
        task_id: 'cauth_1',
        status: 'succeeded',
        connection_id: 'conn_1',
        connection_label: 'Mailbox',
      })),
      submitTask: vi.fn(),
      completeCallback: vi.fn(),
    }

    await mountAt('/auth/connection-tasks/cauth_1/success', facade)
    await flushPromises()

    expect(FakeBroadcastChannel.instances).toHaveLength(1)
    expect(FakeBroadcastChannel.instances[0]?.name).toBe('connection-auth-task:cauth_1')
    expect(FakeBroadcastChannel.instances[0]?.postMessage).toHaveBeenCalledWith({
      type: 'succeeded',
      taskId: 'cauth_1',
      connectionId: 'conn_1',
    })
    expect(openerPostMessage).toHaveBeenCalledWith(
      {
        type: 'connection-auth-task.succeeded',
        taskId: 'cauth_1',
        connectionId: 'conn_1',
      },
      '*',
    )
    expect(closeMocks.bestEffortCloseWindow).toHaveBeenCalled()
  })
})
