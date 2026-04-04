import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import ConnectionsPage from '../pages/ConnectionsPage.vue'
import {
  defaultTranslate,
  remoteTaskUserRuntimeKey,
  type RemoteTaskUserConnectionListResponse,
  type RemoteTaskUserFacade,
} from '../facade'

function createFacade(): RemoteTaskUserFacade {
  return {
    listConnectors: vi.fn(async () => ({ connectors: [] })),
    getConnector: vi.fn(async () => ({ id: 'inst_1' })),
    listConnections: vi.fn(async () => ({ connections: [] })),
    createConnection: vi.fn(async () => ({ id: 'connection_1' })),
    getConnection: vi.fn(async () => ({ id: 'connection_1' })),
    getConnectionAction: vi.fn(async () => ({ action_key: 'list_repos' })),
    executeConnectionAction: vi.fn(async () => ({ execution_id: 'exec_1' })),
    deleteConnection: vi.fn(async () => ({})),
    reauthConnection: vi.fn(async () => ({})),
    listTasks: vi.fn(async () => ({ executions: [] })),
    getTask: vi.fn(async () => ({ id: 'task_1' })),
    cancelTask: vi.fn(async () => ({})),
    deleteTask: vi.fn(async () => ({})),
  }
}

async function mountPage(facade: RemoteTaskUserFacade) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'bundle-connections', component: ConnectionsPage },
      { path: '/connectors', name: 'bundle-connectors', component: defineComponent({ template: '<div />' }) },
      { path: '/connections/:id', name: 'bundle-connection-detail', component: defineComponent({ template: '<div />' }) },
    ],
  })

  await router.push('/')
  await router.isReady()

  const wrapper = mount(ConnectionsPage, {
    global: {
      plugins: [router],
      provide: {
        [remoteTaskUserRuntimeKey as symbol]: {
          facade,
          authTaskFacade: {
            getTask: vi.fn(),
            submitTask: vi.fn(),
            completeCallback: vi.fn(),
          },
          routePrefix: 'bundle',
          t: defaultTranslate,
        },
      },
    },
  })

  await flushPromises()
  return { wrapper }
}

describe('ConnectionsPage loading state', () => {
  it('does not render the empty state while the connection list request is pending', async () => {
    let resolveConnections: ((value: RemoteTaskUserConnectionListResponse) => void) | null = null
    const facade = createFacade()
    facade.listConnections = vi.fn(() => new Promise<RemoteTaskUserConnectionListResponse>((resolve) => {
      resolveConnections = resolve
    }))

    const { wrapper } = await mountPage(facade)

    expect(facade.listConnections).toHaveBeenCalled()
    expect(wrapper.find('[data-test-id="remote-task-user.connections.connect-first"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain("You haven't connected any apps yet.")

    resolveConnections?.({
      connections: [
        {
          id: 'connection_1',
          connector_id: 'inst_github_shared',
          package: { name: 'GitHub' },
          label: 'GitHub Team',
          status: 'active',
          created_at: '2026-03-25T00:00:00Z',
        },
      ],
    })
    await flushPromises()

    expect(wrapper.find('[data-test-id="remote-task-user.connections.row.connection_1.detail"]').exists()).toBe(true)
  })
})
