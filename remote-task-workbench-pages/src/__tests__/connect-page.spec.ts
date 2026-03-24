import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { createConnectorWorkbenchRoutes } from '../routes'
import type { ConnectorWorkbenchFacade } from '../facade'

const facade: ConnectorWorkbenchFacade = {
  getWorkbench: vi.fn(async () => ({
    available_connectors: [],
    discoverable_connectors: [],
  })),
  getConnectorDetail: vi.fn(async () => ({
    connector_id: 'gmail',
    name: 'Gmail',
  })),
  createConnection: vi.fn(async () => ({ id: 'connection_1' })),
}

describe('ConnectPage', () => {
  it('shows connect guidance before connecting', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/team/:teamId',
          component: defineComponent({ components: { RouterView }, template: '<RouterView />' }),
          children: createConnectorWorkbenchRoutes({
            basePath: 'connectors',
            routePrefix: 'team-connectors',
            facade,
          }),
        },
      ],
    })

    await router.push('/team/team_1/connectors/gmail/connect')
    await router.isReady()

    const wrapper = mount(defineComponent({ components: { RouterView }, template: '<RouterView />' }), {
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Connect App')
    expect(wrapper.text()).toContain('What happens next')
  })
})
