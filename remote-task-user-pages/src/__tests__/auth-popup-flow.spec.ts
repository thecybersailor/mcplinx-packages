import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView, type RouteRecordRaw } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRemoteTaskUserRoutes } from '../routes'
import type { RemoteTaskUserFacade } from '../facade'
import { openAuthTaskWindow } from '../authTaskWindow'

vi.mock('../authTaskWindow', () => ({
  openAuthTaskWindow: vi.fn(() => ({ taskId: 'cauth_1', popupBlocked: false, cleanup: vi.fn() })),
}))

function createFacade(): RemoteTaskUserFacade {
  return {
    listConnectors: vi.fn(async () => ({
      connectors: [{ id: 'inst_mail_team', name: 'Mail Team', package: { name: 'Mail' }, version: '1.0.0' }],
    })),
    getConnector: vi.fn(async () => ({ id: 'inst_mail_team' })),
    listConnections: vi.fn(async () => ({ connections: [{ id: 'connection_1', connector_id: 'inst_mail_team', label: 'Mailbox', status: 'active' }] })),
    createConnection: vi.fn(async () => ({ url: 'https://app.example/auth/connection-tasks/cauth_1' })),
    getConnection: vi.fn(async () => ({ id: 'connection_1', connector_id: 'inst_mail_team', label: 'Mailbox', status: 'active' })),
    getConnectionAction: vi.fn(async () => ({ action_key: 'sync_transform' })),
    executeConnectionAction: vi.fn(async () => ({ execution_id: 'exec_1' })),
    deleteConnection: vi.fn(async () => ({})),
    reauthConnection: vi.fn(async () => ({ url: 'https://app.example/auth/connection-tasks/cauth_2' })),
    listTasks: vi.fn(async () => ({ executions: [] })),
    getTask: vi.fn(async () => ({ id: 'task_1' })),
    cancelTask: vi.fn(async () => ({})),
    deleteTask: vi.fn(async () => ({})),
  }
}

async function mountAt(path: string, facade: RemoteTaskUserFacade) {
  const [route] = createRemoteTaskUserRoutes({
    basePath: 'integrations',
    routePrefix: 'bundle',
    facade,
    authTaskFacade: {
      getTask: vi.fn(),
      submitTask: vi.fn(),
      completeCallback: vi.fn(),
    },
  }) as unknown as RouteRecordRaw[]

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        component: defineComponent({ components: { RouterView }, template: '<RouterView />' }),
        children: [route!],
      },
    ],
  })

  await router.push(path)
  await router.isReady()

  const wrapper = mount(defineComponent({ components: { RouterView }, template: '<RouterView />' }), {
    global: {
      plugins: [router],
    },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('remote task user auth popup flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens auth task in separate window from connect page', async () => {
    const facade = createFacade()
    await mountAt('/integrations/connectors/inst_mail_team/connect', facade)
    await flushPromises()

    expect(facade.createConnection).toHaveBeenCalledWith({ connector_id: 'inst_mail_team' })
    expect(openAuthTaskWindow).toHaveBeenCalledWith(expect.objectContaining({
      authUrl: 'https://app.example/auth/connection-tasks/cauth_1',
    }))
  })

  it('opens auth task in separate window from connection detail reauth', async () => {
    const facade = createFacade()
    const { wrapper } = await mountAt('/integrations/connections/connection_1', facade)

    await wrapper.get('[data-test-id="remote-task-user.connection-detail.reauth"]').trigger('click')
    await flushPromises()

    expect(facade.reauthConnection).toHaveBeenCalledWith('connection_1')
    expect(openAuthTaskWindow).toHaveBeenCalledWith(expect.objectContaining({
      authUrl: 'https://app.example/auth/connection-tasks/cauth_2',
    }))
  })
})
