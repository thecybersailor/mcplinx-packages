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
    expect(wrapper.text()).toContain('Package Statistics')
    expect(wrapper.text()).toContain('Total Instances')
    await wrapper.get('[data-test-id="remote-task-management.package-detail.shared-connections"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('team-shared-connections')
    expect(router.currentRoute.value.query.connector_id).toBe('pkg_1')
  })

  it('opens create-instance sheet with shared sheet structure', async () => {
    const facade = createFacade(Promise.resolve({
      id: 'pkg_1',
      hashID: 'pkg_1',
      name: 'WeCom Docs',
      package_description: 'desc',
    }))
    vi.mocked(facade.listPackageVersions).mockResolvedValue([
      { id: 1, version: 'v1', toolCount: 2, createdAt: '2026-03-26T00:00:00Z' },
    ] as any)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/packages/:pkgId',
          component: RuntimeProvider,
          props: { facade },
          children: [{ path: '', component: PackageDetailPage }],
        },
      ],
    })

    await router.push('/packages/pkg_1')
    await router.isReady()

    const wrapper = mount(defineComponent(() => () => h(RouterView)), {
      attachTo: document.body,
      global: {
        plugins: [router],
      },
    })

    await flushPromises()
    await wrapper.get('[data-test-id="remote-task-management.package-detail.create-instance"]').trigger('click')
    await flushPromises()

    expect(document.querySelector('[data-test-id="remote-task-management.package-detail.create-instance.sheet"]')).toBeTruthy()
    expect(wrapper.html()).not.toContain('fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm')
    expect(wrapper.find('select').exists()).toBe(false)
    expect(document.querySelector('[data-test-id="remote-task-management.package-detail.create-instance.version.trigger"]')).toBeTruthy()
    expect(document.querySelector('[data-test-id="remote-task-management.package-detail.create-instance.visibility.trigger"]')).toBeTruthy()

    wrapper.unmount()
  })

  it('renders package detail panels through shared card primitives', async () => {
    const facade = createFacade(Promise.resolve({
      id: 'pkg_1',
      hashID: 'pkg_1',
      name: 'WeCom Docs',
      package_description: 'desc',
    }))
    vi.mocked(facade.listPackageVersions).mockResolvedValue([
      { id: 1, version: 'v1', toolCount: 2, createdAt: '2026-03-26T00:00:00Z' },
    ] as any)
    vi.mocked(facade.listPackageInstances).mockResolvedValue([
      { id: 7, name: 'my instance', status: 'active', visibility: 'private', activeVersion: 'v1' },
    ] as any)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/packages/:pkgId',
          component: RuntimeProvider,
          props: { facade },
          children: [{ path: '', component: PackageDetailPage }],
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

    expect(wrapper.get('[data-test-id="remote-task-management.package-detail.page"]').attributes()['data-slot']).toBe('card')
    expect(wrapper.findAll('[data-slot="card"]').length).toBeGreaterThanOrEqual(5)
  })
})
