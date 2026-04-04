import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView, type RouteRecordRaw } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRemoteTaskSharedConnectionRoutes, type RemoteTaskSharedConnectionFacade } from '../index'

const CONNECTOR_UUID = 'bd8f5828-62f4-5066-8893-d46ecd02a5c2'

function createFacade(): RemoteTaskSharedConnectionFacade {
  return {
    listConnections: vi.fn(async () => ({ items: [] })),
    createConnection: vi.fn(async () => ({ id: 'shared_1' })),
    createAuthTask: vi.fn(async () => ({ task_id: 'cauth_1', auth_url: 'https://app.example/auth/connection-tasks/cauth_1' })),
    startAuth: vi.fn(async () => ({ connection_id: 'shared_1', fields: [] })),
    submitAuth: vi.fn(async () => ({ id: 'shared_1' })),
    getConnection: vi.fn(async () => ({
      id: 'shared_1',
      connector_id: CONNECTOR_UUID,
      label: 'Shared Gmail',
      available_actions: [
        {
          key: 'sync_transform',
          name: 'Sync Transform',
          description: 'Transform data',
          kind: 'sync',
        },
      ],
      token_expires_at: '2026-04-01T00:00:00Z',
      auth_scopes: ['gmail.read'],
      required_scopes: ['gmail.read', 'gmail.write'],
      requires_reauth: true,
      resolution_hint: '重新授权以补齐缺失 scopes。',
    })),
    getConnectionAction: vi.fn(async () => ({
      key: 'sync_transform',
      input_schema: {
        type: 'object',
        properties: {
          text: { type: 'string', title: 'Text' },
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
    updateConnection: vi.fn(async () => ({ id: 'shared_1' })),
    deleteConnection: vi.fn(async () => ({})),
    reauthConnection: vi.fn(async () => ({ connection_id: 'shared_1', fields: [] })),
    explainFallback: vi.fn(async () => ({ connector_id: CONNECTOR_UUID, candidates: [] })),
  }
}

async function mountAt(facade: RemoteTaskSharedConnectionFacade) {
  const [route] = createRemoteTaskSharedConnectionRoutes({
    scope: 'team',
    basePath: 'shared-connections',
    routePrefix: 'shared-connections',
    facade,
    authTaskFacade: {
      getTask: vi.fn(),
      submitTask: vi.fn(),
      completeCallback: vi.fn(),
    },
    taskDetailTarget: (executionId) => ({ name: 'task-detail', params: { id: executionId } }),
  }) as unknown as RouteRecordRaw[]

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        component: defineComponent({ components: { RouterView }, template: '<RouterView />' }),
        children: [route!],
      },
      {
        path: '/tasks/:id',
        name: 'task-detail',
        component: defineComponent({ template: '<div data-test-id="shared-connections.task-detail" />' }),
      },
    ],
  })

  await router.push('/shared-connections/connections/shared_1')
  await router.isReady()

  const wrapper = mount(defineComponent({ components: { RouterView }, template: '<RouterView />' }), {
    attachTo: document.body,
    global: {
      plugins: [router],
    },
  })

  await flushPromises()
  return { wrapper, router }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ConnectionDetailPage', () => {
  it('shows status detail sections and reauthorize action', async () => {
    const { wrapper } = await mountAt(createFacade())

    expect(wrapper.text()).toContain('Token Expires At')
    expect(wrapper.text()).toContain('Authorized Scopes')
    expect(wrapper.text()).toContain('Required Scopes')
    expect(wrapper.text()).toContain('Reauthorize')
  })

  it('loads action schema when a tool card is clicked', async () => {
    const facade = createFacade()
    const { wrapper } = await mountAt(facade)

    await wrapper.get('[data-test-id="shared-connections.detail.action.sync_transform"]').trigger('click')
    await flushPromises()

    expect(facade.getConnectionAction).toHaveBeenCalledWith('shared_1', 'sync_transform')
    expect(document.body.querySelector('[data-test-id="shared-connections.detail.runner"]')).toBeTruthy()
  })

  it('executes sync action and stays on current page with inline result', async () => {
    const facade = createFacade()
    const { wrapper, router } = await mountAt(facade)

    await wrapper.get('[data-test-id="shared-connections.detail.action.sync_transform"]').trigger('click')
    await flushPromises()

    const textField = document.body.querySelector(
      '[data-test-id="shared-connections.detail.runner.field.text"]',
    ) as HTMLInputElement | HTMLTextAreaElement | null
    expect(textField).toBeTruthy()
    textField!.value = 'hello'
    textField!.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    const form = document.body.querySelector(
      '[data-test-id="shared-connections.detail.runner.submit"]',
    ) as HTMLFormElement | null
    expect(form).toBeTruthy()
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(facade.executeConnectionAction).toHaveBeenCalledWith('shared_1', 'sync_transform', {
      input: { text: 'hello' },
    })
    expect(router.currentRoute.value.name).toBe('shared-connections-detail')
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
    const { wrapper, router } = await mountAt(facade)

    await wrapper.get('[data-test-id="shared-connections.detail.action.sync_transform"]').trigger('click')
    await flushPromises()

    const textField = document.body.querySelector(
      '[data-test-id="shared-connections.detail.runner.field.text"]',
    ) as HTMLInputElement | HTMLTextAreaElement | null
    expect(textField).toBeTruthy()
    textField!.value = 'hello'
    textField!.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    const form = document.body.querySelector(
      '[data-test-id="shared-connections.detail.runner.submit"]',
    ) as HTMLFormElement | null
    expect(form).toBeTruthy()
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('task-detail')
    expect(router.currentRoute.value.params.id).toBe('task_1')
  })
})
