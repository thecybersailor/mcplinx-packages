import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, provide } from 'vue'
import { createMemoryHistory, createRouter, RouterView, useRoute } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import InstanceDetailPage from '../pages/InstanceDetailPage.vue'
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
    listInstances: vi.fn(async () => []),
    createInstance: vi.fn(async () => ({ id: 9 })),
    getInstance: vi.fn(async () => ({
      id: 7,
      name: 'Tenant Slack',
      status: 'active',
      visibility: 'tenant',
      activeVersion: '1.2.3',
      pkgID: 'pkg_1',
    })),
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
  },
  setup(props) {
    const route = useRoute()
    provide(remoteTaskManagementRuntimeKey, {
      facade: props.facade,
      scope: 'tenant',
      routePrefix: 'tenant-remote-task',
      t: defaultTranslate,
    })
    return () => h(RouterView, { key: route.fullPath })
  },
})

describe('InstanceDetailPage', () => {
  it('shows deployment, variables, secrets, and version history sections', async () => {
    const facade = createFacade()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/instances/:instanceId',
          component: RuntimeProvider,
          props: { facade },
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
    expect(wrapper.text()).toContain('Active Deployment')
    expect(wrapper.text()).toContain('Variables')
    expect(wrapper.text()).toContain('Secrets')
    expect(wrapper.text()).toContain('Version History')
  })
})
