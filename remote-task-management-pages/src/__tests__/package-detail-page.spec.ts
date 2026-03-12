import { flushPromises, mount } from '@vue/test-utils'
import { computed, defineComponent, h, provide } from 'vue'
import { createMemoryHistory, createRouter, RouterView, useRoute } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import PackageDetailPage from '../pages/PackageDetailPage.vue'
import {
  defaultTranslate,
  remoteTaskManagementRuntimeKey,
  type RemoteTaskManagementFacade,
} from '../facade'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function createFacade(getPackagePromise: Promise<any>): RemoteTaskManagementFacade {
  return {
    listPackages: vi.fn(async () => []),
    getPackage: vi.fn(() => getPackagePromise),
    listPackageVersions: vi.fn(async () => []),
    listPackageInstances: vi.fn(async () => []),
    listInstances: vi.fn(async () => []),
    getInstance: vi.fn(async () => ({ id: 1 })),
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
      scope: 'team',
      routePrefix: 'team-remote-task',
      sharedConnectionRoutePrefix: 'team-shared',
      t: defaultTranslate,
    })
    return () => h(RouterView, { key: computed(() => route.fullPath).value })
  },
})

describe('PackageDetailPage', () => {
  it('exposes page test id only after package detail finishes loading', async () => {
    const pkg = deferred<{ id: string; hashID: string; name: string; package_description: string }>()
    const facade = createFacade(pkg.promise)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/packages/:pkgId',
          component: RuntimeProvider,
          props: { facade },
          children: [{ path: '', component: PackageDetailPage }],
        },
        {
          path: '/shared/connections',
          name: 'team-shared-connections',
          component: defineComponent({ name: 'SharedConnectionsStub', render: () => h('div', 'shared') }),
        },
      ],
    })

    await router.push('/packages/pkg_1')
    await router.isReady()

    const wrapper = mount(defineComponent(() => () => h(RouterView)), {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()
    expect(facade.getPackage).toHaveBeenCalledWith('pkg_1')
    expect(wrapper.find('[data-test-id="remote-task-management.package-detail.page"]').exists()).toBe(false)

    pkg.resolve({
      id: 'pkg_1',
      hashID: 'pkg_1',
      name: 'WeCom Docs',
      package_description: 'desc',
    })

    await flushPromises()
    expect(wrapper.get('[data-test-id="remote-task-management.package-detail.page"]').text()).toContain('Versions')
    await wrapper.get('[data-test-id="remote-task-management.package-detail.shared-connections"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('team-shared-connections')
    expect(router.currentRoute.value.query.connector_id).toBe('pkg_1')
  })
})
