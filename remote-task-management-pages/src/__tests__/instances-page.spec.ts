import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, provide } from 'vue'
import { createMemoryHistory, createRouter, RouterView, useRoute } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import InstanceDetailPage from '../pages/InstanceDetailPage.vue'
import InstancesPage from '../pages/InstancesPage.vue'
import {
  defaultTranslate,
  remoteTaskManagementRuntimeKey,
  type RemoteTaskManagementFacade,
} from '../facade'

function createFacade(): RemoteTaskManagementFacade {
  return {
    listPackages: vi.fn(async () => []),
    getPackage: vi.fn(async () => ({ id: 1 })),
    listPackageVersions: vi.fn(async () => []),
    listPackageInstances: vi.fn(async () => []),
    listInstances: vi.fn(async () => [{ id: 7, name: 'Tenant Slack', status: 'pending_review' }]),
    createInstance: vi.fn(async () => ({ id: 9 })),
    getInstance: vi.fn(async () => ({ id: 7 })),
    updateInstance: vi.fn(async () => ({ id: 7 })),
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
      type: String as () => 'platform' | 'tenant' | 'team',
      required: true,
    },
  },
  setup(props) {
    const route = useRoute()
    provide(remoteTaskManagementRuntimeKey, {
      facade: props.facade,
      scope: props.scope,
      routePrefix: 'tenant-remote-task',
      t: defaultTranslate,
    })
    return () => h(RouterView, { key: route.fullPath })
  },
})

describe('InstancesPage', () => {
  it('loads instances from facade', async () => {
    const facade = createFacade()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/instances',
          component: RuntimeProvider,
          props: { facade, scope: 'tenant' },
          children: [{ path: '', component: InstancesPage }],
        },
      ],
    })

    await router.push('/instances')
    await router.isReady()

    const wrapper = mount(defineComponent(() => () => h(RouterView)), {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()
    expect(facade.listInstances).toHaveBeenCalled()
    expect(wrapper.get('[data-test-id="remote-task-management.instances.row.7"]').text()).toContain('Tenant Slack')
    expect(wrapper.find('[data-test-id="remote-task-management.instances.status"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Visibility')
    expect(wrapper.text()).toContain('Owner')
  })

  it('hides moderation actions for team scope instance detail', async () => {
    const facade = createFacade()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/instances/:instanceId',
          component: RuntimeProvider,
          props: { facade, scope: 'team' },
          children: [{ path: '', component: InstanceDetailPage }],
        },
      ],
    })

    await router.push('/instances/inst_7')
    await router.isReady()

    const wrapper = mount(defineComponent(() => () => h(RouterView)), {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()
    expect(wrapper.find('[data-test-id="remote-task-management.instance-detail.approve"]').exists()).toBe(false)
    expect(wrapper.find('[data-test-id="remote-task-management.instance-detail.reject"]').exists()).toBe(false)
  })
})
