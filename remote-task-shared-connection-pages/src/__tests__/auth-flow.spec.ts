import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView, type RouteRecordRaw } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { createRemoteTaskSharedConnectionRoutes, type RemoteTaskSharedConnectionFacade } from '../index'

const CONNECTOR_UUID = 'bd8f5828-62f4-5066-8893-d46ecd02a5c2'

function createFacade(): RemoteTaskSharedConnectionFacade {
  return {
    listConnections: vi.fn(async () => ({ items: [] })),
    createConnection: vi.fn(async () => ({ id: 'shared_1' })),
    startAuth: vi.fn(async () => ({
      connection_id: 'shared_1',
      type: 'api_key',
      fields: [{ name: 'api_key', label: 'API Key' }],
    })),
    submitAuth: vi.fn(async () => ({ id: 'shared_1', label: 'Support Mailbox' })),
    getConnection: vi.fn(async () => ({
      id: 'shared_1',
      connector_id: CONNECTOR_UUID,
      label: 'Support Mailbox',
      requires_reauth: true,
      principal_pattern: 'org/team/team_1',
      inherits_to: ['team'],
      resolution_hint: 'team -> tenant -> platform',
    })),
    updateConnection: vi.fn(async () => ({ id: 'shared_1' })),
    deleteConnection: vi.fn(async () => ({})),
    reauthConnection: vi.fn(async () => ({
      connection_id: 'shared_1',
      type: 'api_key',
      fields: [{ name: 'api_key', label: 'API Key' }],
    })),
    explainFallback: vi.fn(async () => ({ connector_id: CONNECTOR_UUID, candidates: [] })),
  }
}

async function mountAt(path: string, facade: RemoteTaskSharedConnectionFacade) {
  const [route] = createRemoteTaskSharedConnectionRoutes({
    scope: 'team',
    basePath: 'shared-connections',
    routePrefix: 'shared-connections',
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
    },
  })

  await flushPromises()
  return { wrapper, router }
}

describe('shared connection auth flow', () => {
  it('starts auth and submits auth from create page', async () => {
    const facade = createFacade()
    const { wrapper, router } = await mountAt('/shared-connections/connections/new', facade)

    await wrapper.get('[data-test-id="shared-connections.create.connector-id"]').setValue(CONNECTOR_UUID)
    await wrapper.get('[data-test-id="shared-connections.create.label"]').setValue('Support Mailbox')
    await wrapper.get('[data-test-id="shared-connections.create.principal-pattern"]').setValue('org/team/team_1')
    await wrapper.get('[data-test-id="shared-connections.create.start-auth"]').trigger('click')
    await flushPromises()

    expect(facade.startAuth).toHaveBeenCalled()
    expect(wrapper.find('[data-test-id="shared-connections.create.auth-form"]').exists()).toBe(true)

    await wrapper.get('[data-test-id="shared-connections.create.auth-field.api_key"]').setValue('secret')
    await wrapper.get('[data-test-id="shared-connections.create.submit-auth"]').trigger('click')
    await flushPromises()

    expect(facade.submitAuth).toHaveBeenCalledWith(expect.objectContaining({
      connection_id: 'shared_1',
      auth_data: { 'API Key': 'secret' },
    }))
    expect(router.currentRoute.value.name).toBe('shared-connections-detail')
  })

  it('prefills connector id from query on create page', async () => {
    const facade = createFacade()
    const { wrapper } = await mountAt(`/shared-connections/connections/new?connector_id=${CONNECTOR_UUID}`, facade)

    expect((wrapper.get('[data-test-id="shared-connections.create.connector-id"]').element as HTMLInputElement).value).toBe(CONNECTOR_UUID)
  })

  it('shows reauth form from detail page', async () => {
    const facade = createFacade()
    const { wrapper } = await mountAt('/shared-connections/connections/shared_1', facade)

    await wrapper.get('[data-test-id="shared-connections.detail.reauth"]').trigger('click')
    await flushPromises()
    expect(facade.reauthConnection).toHaveBeenCalledWith('shared_1', expect.objectContaining({
      principal_pattern: 'org/team/team_1',
    }))
  })
})
