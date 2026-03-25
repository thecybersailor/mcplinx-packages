import { flushPromises, mount } from '@vue/test-utils'
import { computed, defineComponent, h, provide } from 'vue'
import { createMemoryHistory, createRouter, RouterView, useRoute } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import DashboardPage from '../pages/DashboardPage.vue'
import {
  defaultTranslate,
  remoteTaskManagementRuntimeKey,
  type RemoteTaskManagementFacade,
  type RemoteTaskManagementScope,
} from '../facade'

function createFacade(): RemoteTaskManagementFacade {
  return {
    listPackages: vi.fn(async () => [{ id: 1, hashID: 'pkg_1', name: 'WeCom Docs', package_description: 'desc', versions: [] }]),
    getPackage: vi.fn(async () => ({ id: 1 })),
    listPackageVersions: vi.fn(async () => []),
    listPackageInstances: vi.fn(async () => []),
    listInstances: vi.fn(async () => [{ id: 7, name: 'tenant instance', status: 'pending_review' }]),
    createInstance: vi.fn(async () => ({ id: 9 })),
    getInstance: vi.fn(async () => ({ id: 1 })),
    updateInstance: vi.fn(async () => ({ id: 1 })),
    reviewInstance: vi.fn(async () => ({})),
    createUploadUrls: vi.fn(async () => ({ upload_urls: {} })),
    publish: vi.fn(async () => ({})),
    deploy: vi.fn(async () => ({ message: 'ok' })),
    rollback: vi.fn(async () => ({ message: 'ok' })),
    listConfigs: vi.fn(async () => []),
    getConfig: vi.fn(async () => ({ id: 'cfg_1' })),
    updateConfig: vi.fn(async () => ({ id: 'cfg_1' })),
  }
}

const RuntimeProvider = defineComponent({
  name: 'RuntimeProvider',
  props: {
    facade: {
      type: Object as () => RemoteTaskManagementFacade,
      required: true,
    },
    scope: {
      type: String as () => RemoteTaskManagementScope,
      required: true,
    },
  },
  setup(props) {
    const route = useRoute()
    provide(remoteTaskManagementRuntimeKey, {
      facade: props.facade,
      scope: props.scope,
      routePrefix: 'connectors',
      sharedConnectionRoutePrefix: 'connectors-shared-connections',
      t: defaultTranslate,
    })
    return () => h(RouterView, { key: computed(() => route.fullPath).value })
  },
})

describe('DashboardPage', () => {
  it('surfaces connectors, connections and cli hint blocks from the same entry domain', async () => {
    const facade = createFacade()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/connectors',
          component: RuntimeProvider,
          props: { facade, scope: 'tenant' },
          children: [
            { path: '', component: DashboardPage },
            { path: 'packages', name: 'connectors-packages', component: defineComponent(() => () => h('div', 'packages')) },
            { path: 'shared-connections/connections', name: 'connectors-shared-connections-connections', component: defineComponent(() => () => h('div', 'connections')) },
          ],
        },
      ],
    })

    await router.push('/connectors')
    await router.isReady()

    const wrapper = mount(defineComponent(() => () => h(RouterView)), {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Connectors')
    expect(wrapper.text()).toContain('Connections')
    expect(wrapper.text()).toContain('CLI Hint')

    await wrapper.get('[data-test-id="remote-task-management.dashboard.open-connectors"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('connectors-packages')

    await router.push('/connectors')
    await flushPromises()
    await wrapper.get('[data-test-id="remote-task-management.dashboard.open-connections"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('connectors-shared-connections-connections')
  })
})
