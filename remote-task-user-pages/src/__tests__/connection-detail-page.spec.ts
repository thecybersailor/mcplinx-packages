import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView, type RouteRecordRaw } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRemoteTaskUserRoutes } from '../routes'
import {
  defaultTranslate,
  remoteTaskUserRuntimeKey,
  type RemoteTaskUserFacade,
} from '../facade'

function createFacade(): RemoteTaskUserFacade {
  return {
    listConnectors: vi.fn(async () => ({ connectors: [] })),
    getConnector: vi.fn(async () => ({ id: 'inst_example_team' })),
    listConnections: vi.fn(async () => ({ connections: [] })),
    createConnection: vi.fn(async () => ({ id: 'connection_1' })),
    getConnection: vi.fn(async () => ({
      id: 'connection_1',
      connector_id: 'inst_example_team',
      package: { name: 'Example' },
      label: 'Example Team',
      status: 'active',
      auth_type: 'oauth2',
      token_expires_at: '2026-04-05T12:00:00Z',
      available_actions: [
        {
          key: 'sync_transform',
          name: 'Sync Transform',
          description: 'Transform data',
          kind: 'sync',
        },
      ],
    })),
    getConnectionAction: vi.fn(async () => ({
      key: 'sync_transform',
      name: 'Sync Transform',
      input_schema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            title: 'Text',
          },
        },
        required: ['text'],
      },
    })),
    executeConnectionAction: vi.fn(async () => ({
      success: true,
      result: { echoed: 'hello' },
      executed_at: '2026-04-04T12:00:00Z',
      execution_id: 'exec_1',
      status: 'SUCCEEDED',
      kind: 'sync',
      duration: 12,
    })),
    deleteConnection: vi.fn(async () => ({})),
    reauthConnection: vi.fn(async () => ({})),
    listTasks: vi.fn(async () => ({ executions: [] })),
    getTask: vi.fn(async () => ({ id: 'task_1', action_key: 'sync_transform', status: 'pending' })),
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
    attachTo: document.body,
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
  return { wrapper, router }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ConnectionDetailPage invoke flow', () => {
  it('renders available actions as clickable tool cards', async () => {
    const facade = createFacade()
    const { wrapper } = await mountAt('/integrations/connections/connection_1', facade)

    expect(wrapper.get('[data-test-id="remote-task-user.connection-detail.action.sync_transform"]').exists()).toBe(true)
  })

  it('loads action schema when a tool card is clicked', async () => {
    const facade = createFacade()
    const { wrapper } = await mountAt('/integrations/connections/connection_1', facade)

    await wrapper.get('[data-test-id="remote-task-user.connection-detail.action.sync_transform"]').trigger('click')
    await flushPromises()

    expect(facade.getConnectionAction).toHaveBeenCalledWith('connection_1', 'sync_transform')
    expect(document.body.querySelector('[data-test-id="remote-task-user.connection-detail.runner"]')).toBeTruthy()
  })

  it('executes sync action and stays on current page with inline result', async () => {
    const facade = createFacade()
    const { wrapper, router } = await mountAt('/integrations/connections/connection_1', facade)

    await wrapper.get('[data-test-id="remote-task-user.connection-detail.action.sync_transform"]').trigger('click')
    await flushPromises()

    const textField = document.body.querySelector(
      '[data-test-id="remote-task-user.connection-detail.runner.field.text"]',
    ) as HTMLInputElement | HTMLTextAreaElement | null
    expect(textField).toBeTruthy()
    textField!.value = 'hello'
    textField!.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    const form = document.body.querySelector(
      '[data-test-id="remote-task-user.connection-detail.runner.submit"]',
    ) as HTMLFormElement | null
    expect(form).toBeTruthy()
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(facade.executeConnectionAction).toHaveBeenCalledWith('connection_1', 'sync_transform', {
      input: { text: 'hello' },
    })
    expect(router.currentRoute.value.name).toBe('bundle-connection-detail')
    expect(document.body.textContent).toContain('Execution Result')
    expect(document.body.textContent).toContain('"echoed": "hello"')
  })

  it('routes to task detail only for async execution responses', async () => {
    const facade = createFacade()
    facade.executeConnectionAction = vi.fn(async () => ({
      execution_id: 'task_1',
      status: 'RUNNING',
      task_id: 'task_1',
      webhook_supported: false,
      kind: 'async',
    }))
    const { wrapper, router } = await mountAt('/integrations/connections/connection_1', facade)

    await wrapper.get('[data-test-id="remote-task-user.connection-detail.action.sync_transform"]').trigger('click')
    await flushPromises()

    const textField = document.body.querySelector(
      '[data-test-id="remote-task-user.connection-detail.runner.field.text"]',
    ) as HTMLInputElement | HTMLTextAreaElement | null
    expect(textField).toBeTruthy()
    textField!.value = 'hello'
    textField!.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    const form = document.body.querySelector(
      '[data-test-id="remote-task-user.connection-detail.runner.submit"]',
    ) as HTMLFormElement | null
    expect(form).toBeTruthy()
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('bundle-task-detail')
    expect(router.currentRoute.value.params.id).toBe('task_1')
  })

  it('does not render auth metadata status details and keeps stable connection fields', async () => {
    const facade = createFacade()
    const { wrapper } = await mountAt('/integrations/connections/connection_1', facade)

    expect(wrapper.text()).toContain('Example Team')
    expect(wrapper.text()).not.toContain('Status Details')
    expect(wrapper.text()).not.toContain('Auth Type')
    expect(wrapper.text()).not.toContain('Token Expires At')
    expect(wrapper.text()).not.toContain('Authorized Scopes')
    expect(wrapper.text()).not.toContain('Required Scopes')
  })
})
