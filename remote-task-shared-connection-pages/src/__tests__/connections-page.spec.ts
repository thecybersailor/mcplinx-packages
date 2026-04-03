import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView, type RouteRecordRaw } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { createRemoteTaskSharedConnectionRoutes, type RemoteTaskSharedConnectionFacade } from '../index'

const CONNECTOR_UUID = 'bd8f5828-62f4-5066-8893-d46ecd02a5c2'

function createFacade(): RemoteTaskSharedConnectionFacade {
  return {
    listConnections: vi.fn(async () => ({ items: [{ id: 'shared_1', connector_id: CONNECTOR_UUID, label: 'Shared A' }] })),
    createConnection: vi.fn(async () => ({ id: 'shared_1' })),
    startAuth: vi.fn(async () => ({ connection_id: 'shared_1', fields: [] })),
    submitAuth: vi.fn(async () => ({ id: 'shared_1' })),
    getConnection: vi.fn(async () => ({ id: 'shared_1' })),
    updateConnection: vi.fn(async () => ({ id: 'shared_1' })),
    deleteConnection: vi.fn(async () => ({})),
    reauthConnection: vi.fn(async () => ({ connection_id: 'shared_1', fields: [] })),
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

describe('shared connections page', () => {
  it('filters list by connector and carries connector id into create page', async () => {
    const facade = createFacade()
    const { wrapper, router } = await mountAt(`/shared-connections/connections?connector_id=${CONNECTOR_UUID}`, facade)

    expect(facade.listConnections).toHaveBeenCalledWith({
      scope: 'team',
      connector_id: CONNECTOR_UUID,
    })

    await wrapper.get('[data-test-id="shared-connections.create-link"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('shared-connections-create')
    expect(router.currentRoute.value.query.connector_id).toBe(CONNECTOR_UUID)
  })
})
