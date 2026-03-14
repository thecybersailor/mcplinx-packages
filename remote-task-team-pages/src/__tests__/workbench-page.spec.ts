import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { createTeamConnectorWorkbenchRoutes } from '../routes'
import type { TeamConnectorWorkbenchFacade } from '../facade'

const facade: TeamConnectorWorkbenchFacade = {
  getWorkbench: vi.fn(async (query?: { limit?: number }) => ({
    available_connectors: [{ id: 'gmail', name: 'Gmail', version: '1.0.0' }],
    discoverable_connectors: query?.limit ? [{ id: 'notion', name: 'Notion', version: '2.0.0' }] : [{ id: 'notion', name: 'Notion', version: '2.0.0' }, { id: 'slack', name: 'Slack', version: '3.0.0' }],
    more_count: 1,
  })),
  getConnectorDetail: vi.fn(async () => ({
    connector_id: 'notion',
    name: 'Notion',
    status: 'discoverable',
    summary: 'not ready',
    next_steps: ['tenant scope: finish auth'],
  })),
  createConnection: vi.fn(async () => ({ id: 'connection_1' })),
}

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: createTeamConnectorWorkbenchRoutes({
      basePath: '/connectors',
      routePrefix: 'team-connectors',
      facade,
    }),
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(defineComponent({ components: { RouterView }, template: '<RouterView />' }), {
    global: { plugins: [router] },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('team connector workbench pages', () => {
  it('shows available and discoverable connectors and supports more/detail/connect flows', async () => {
    const { wrapper, router } = await mountAt('/connectors')
    expect(wrapper.find('[data-test-id="team-connectors.available.card.gmail"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-id="team-connectors.discoverable.card.notion"]').exists()).toBe(true)

    await wrapper.get('[data-test-id="team-connectors.more.top"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('team-connectors-catalog')
    expect(wrapper.find('[data-test-id="team-connectors.catalog.card.slack"]').exists()).toBe(true)

    await router.push('/connectors/notion')
    await flushPromises()
    expect(wrapper.find('[data-test-id="team-connectors.detail.page"]').exists()).toBe(true)

    await router.push('/connectors/gmail/connect')
    await flushPromises()
    await wrapper.get('[data-test-id="team-connectors.connect.label"]').setValue('Team Gmail')
    await wrapper.get('[data-test-id="team-connectors.connect.submit"]').trigger('click')
    await flushPromises()
    expect(facade.createConnection).toHaveBeenCalledWith({
      connector_id: 'gmail',
      label: 'Team Gmail',
    })
  })
})
