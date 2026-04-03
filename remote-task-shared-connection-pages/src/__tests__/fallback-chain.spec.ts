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
      label: 'Support Mailbox',
      principal_pattern: 'org/team/team_1',
      inherits_to: ['team'],
      resolution_hint: 'team -> tenant -> platform',
    })),
    updateConnection: vi.fn(async () => ({ id: 'shared_1' })),
    deleteConnection: vi.fn(async () => ({})),
    reauthConnection: vi.fn(async () => ({ connection_id: 'shared_1', fields: [] })),
    explainFallback: vi.fn(async () => ({
      connector_id: CONNECTOR_UUID,
      selected: {
        id: 'shared_1',
        connector_id: CONNECTOR_UUID,
        label: 'Support Mailbox',
      },
      candidates: [
        { id: 'shared_1', resolution_hint: 'team exact match' },
        { id: 'shared_2', resolution_hint: 'tenant fallback' },
      ],
    })),
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

describe('shared connection bundle', () => {
  it('loads fallback explain chain from connector query', async () => {
    const facade = createFacade()
    const { wrapper } = await mountAt(`/shared-connections/fallback-explain?connector_id=${CONNECTOR_UUID}`, facade)

    expect(facade.explainFallback).toHaveBeenCalledWith({ connector_id: CONNECTOR_UUID })
    expect(wrapper.get('[data-test-id="shared-connections.fallback.selected"]').text()).toContain('Support Mailbox')
    expect(wrapper.get('[data-test-id="shared-connections.fallback.candidate.shared_2"]').text()).toContain('tenant fallback')
  })
})
