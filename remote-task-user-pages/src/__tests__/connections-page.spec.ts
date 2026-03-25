import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView, type RouteRecordRaw } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { createRemoteTaskUserRoutes } from '../routes'
import {
  defaultTranslate,
  remoteTaskUserRuntimeKey,
  type RemoteTaskUserConnectionListResponse,
  type RemoteTaskUserFacade,
} from '../facade'

function createFacade(): RemoteTaskUserFacade {
  return {
    listConnectors: vi.fn(async () => ({
      connectors: [{ id: 'examples/github-connector', package: { name: 'GitHub' }, version: '1.0.0' }],
    })),
    getConnector: vi.fn(async () => ({
      id: 'examples/github-connector',
      package: { name: 'GitHub', package_description: 'docs' },
      version: '1.0.0',
      tools: [{ name: 'list_repos', description: 'List repositories' }],
    })),
    listConnections: vi.fn(async (): Promise<RemoteTaskUserConnectionListResponse> => ({
      connections: [
        {
          id: 'connection_1',
          connector_id: 'examples/github-connector',
          package: { name: 'GitHub' },
          label: 'GitHub Team',
          auth_scopes: ['repo', 'user:email'],
          status: 'active',
          created_at: '2026-03-25T00:00:00Z',
        },
      ],
    })),
    createConnection: vi.fn(async () => ({ id: 'connection_2' })),
    getConnection: vi.fn(async () => ({
      id: 'connection_1',
      connector_id: 'examples/github-connector',
      package: { name: 'GitHub' },
      label: 'GitHub Team',
      status: 'active',
      created_at: '2026-03-25T00:00:00Z',
      tools: [{ name: 'list_repos', description: 'List repositories' }],
    })),
    deleteConnection: vi.fn(async () => ({})),
    reauthConnection: vi.fn(async () => ({ url: 'https://example.com/oauth/start' })),
    listTasks: vi.fn(async () => ({ executions: [] })),
    getTask: vi.fn(async () => ({ id: 'task_1' })),
    cancelTask: vi.fn(async () => ({})),
  }
}

async function mountAt(path: string, facade: RemoteTaskUserFacade) {
  const [route] = createRemoteTaskUserRoutes({
    basePath: 'integrations',
    routePrefix: 'bundle',
    facade,
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
      provide: {
        [remoteTaskUserRuntimeKey as symbol]: { facade, routePrefix: 'bundle', t: defaultTranslate },
      },
    },
  })

  await flushPromises()
  return { wrapper, router }
}

describe('Connection pages', () => {
  it('exposes data-test-id based actions for the historical connection task chain', async () => {
    const facade = createFacade()
    const { wrapper, router } = await mountAt('/integrations/connections', facade)

    expect(facade.listConnections).toHaveBeenCalled()
    expect(wrapper.find('[data-test-id="remote-task-user.connections.connect-app"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-id="remote-task-user.connections.row.connection_1.detail"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-id="remote-task-user.connections.row.connection_1.reauth"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-id="remote-task-user.connections.row.connection_1.disconnect"]').exists()).toBe(true)

    await wrapper.get('[data-test-id="remote-task-user.connections.row.connection_1.detail"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('bundle-connection-detail')
    expect(facade.getConnection).toHaveBeenCalledWith('connection_1')
    expect(wrapper.find('[data-test-id="remote-task-user.connection-detail.page"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-id="remote-task-user.connection-detail.reauth"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-id="remote-task-user.connection-detail.disconnect"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-id="remote-task-user.connection-detail.back"]').exists()).toBe(true)
  })
})
