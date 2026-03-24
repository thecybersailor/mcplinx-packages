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
    connector_id: 'notion',
    name: 'Notion',
    package_description: 'Docs and knowledge management',
    status: 'discoverable',
    summary: '需要先在上游作用域完成接入。',
    next_steps: ['tenant scope: finish auth'],
    latest_version: '2.8.0',
    tool_count: 12,
  })),
  createConnection: vi.fn(async () => ({ id: 'connection_1' })),
}

describe('DiscoverableDetailPage', () => {
  it('shows richer detail sections for discoverable connectors', async () => {
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

    await router.push('/team/team_1/connectors/notion')
    await router.isReady()

    const wrapper = mount(defineComponent({ components: { RouterView }, template: '<RouterView />' }), {
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('接入方式')
    expect(wrapper.text()).toContain('Available Tools')
    expect(wrapper.text()).toContain('Latest Version')
  })
})
