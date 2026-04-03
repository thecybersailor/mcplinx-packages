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
    startAuth: vi.fn(async () => ({ connection_id: 'shared_1', fields: [] })),
    submitAuth: vi.fn(async () => ({ id: 'shared_1' })),
    getConnection: vi.fn(async () => ({
      id: 'shared_1',
      connector_id: CONNECTOR_UUID,
      label: 'Shared Gmail',
      token_expires_at: '2026-04-01T00:00:00Z',
      auth_scopes: ['gmail.read'],
      required_scopes: ['gmail.read', 'gmail.write'],
      requires_reauth: true,
      resolution_hint: '重新授权以补齐缺失 scopes。',
    })),
    updateConnection: vi.fn(async () => ({ id: 'shared_1' })),
    deleteConnection: vi.fn(async () => ({})),
    reauthConnection: vi.fn(async () => ({ connection_id: 'shared_1', fields: [] })),
    explainFallback: vi.fn(async () => ({ connector_id: CONNECTOR_UUID, candidates: [] })),
  }
}

describe('ConnectionDetailPage', () => {
  it('shows status detail sections and reauthorize action', async () => {
    const [route] = createRemoteTaskSharedConnectionRoutes({
      scope: 'team',
      basePath: 'shared-connections',
      routePrefix: 'shared-connections',
      facade: createFacade(),
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

    await router.push('/shared-connections/connections/shared_1')
    await router.isReady()

    const wrapper = mount(defineComponent({ components: { RouterView }, template: '<RouterView />' }), {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()
    expect(wrapper.text()).toContain('Token Expires At')
    expect(wrapper.text()).toContain('Authorized Scopes')
    expect(wrapper.text()).toContain('Required Scopes')
    expect(wrapper.text()).toContain('Reauthorize')
  })
})
