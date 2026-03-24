import { flushPromises, mount } from '@vue/test-utils'
import { computed, defineComponent, h, provide } from 'vue'
import { createMemoryHistory, createRouter, RouterView, useRoute } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import PackagesPage from '../pages/PackagesPage.vue'
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
      routePrefix: 'team-remote-task',
      t: defaultTranslate,
    })
    return () => h(RouterView, { key: computed(() => route.fullPath).value })
  },
})

async function mountAt(path: string, scope: RemoteTaskManagementScope) {
  const facade = createFacade()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/team/:teamId/connectors/packages',
        component: RuntimeProvider,
        props: { facade, scope },
        children: [{ path: '', component: PackagesPage }],
      },
      {
        path: '/connectors/packages',
        component: RuntimeProvider,
        props: { facade, scope },
        children: [{ path: '', component: PackagesPage }],
      },
    ],
  })

  await router.push(path)
  await router.isReady()

  const wrapper = mount(defineComponent(() => () => h(RouterView)), {
    global: {
      plugins: [router],
    },
  })

  await flushPromises()
  return { wrapper, facade }
}

describe('PackagesPage cli hints', () => {
  it('shows team login url and profile-driven commands', async () => {
    const { wrapper } = await mountAt('/team/team_1/connectors/packages', 'team')

    expect(wrapper.find('[data-test-id="remote-task-management.packages.cli-hint"]').exists()).toBe(false)
    await wrapper.get('[data-test-id="remote-task-management.packages.cli-hint-toggle"]').trigger('click')
    await flushPromises()

    const hint = wrapper.get('[data-test-id="remote-task-management.packages.cli-hint"]').text()
    expect(hint).toContain('syntool login --login-url')
    expect(hint).toContain('/team/team_1/linktool-login')
    expect(hint).toContain('syntool publish --payload')
    expect(hint).toContain('syntool deploy --payload')
    expect(hint).not.toContain('--scope')
    expect(hint).not.toContain('--team-id')
    expect(hint).not.toContain('--base-url')
  })

  it('shows tenant login url without old scope flags', async () => {
    const { wrapper } = await mountAt('/connectors/packages', 'tenant')

    await wrapper.get('[data-test-id="remote-task-management.packages.cli-hint-toggle"]').trigger('click')
    await flushPromises()

    const hint = wrapper.get('[data-test-id="remote-task-management.packages.cli-hint"]').text()
    expect(hint).toContain('/dashboard/linktool-login/tenant')
    expect(hint).toContain('syntool publish --payload')
    expect(hint).not.toContain('--team-id')
    expect(hint).not.toContain('--scope')
    expect(hint).not.toContain('--base-url')
  })

  it('uses dark bundle surfaces instead of light borders on packages page', async () => {
    const { wrapper } = await mountAt('/team/team_1/connectors/packages', 'team')

    const page = wrapper.get('[data-test-id="remote-task-management.packages.page"]')
    expect(page.classes().join(' ')).toContain('bg-transparent')
    expect(page.classes().join(' ')).toContain('border-transparent')

    await wrapper.get('[data-test-id="remote-task-management.packages.cli-hint-toggle"]').trigger('click')
    await flushPromises()

    const hint = wrapper.get('[data-test-id="remote-task-management.packages.cli-hint"]')
    expect(hint.classes().join(' ')).toContain('border-white/10')
    expect(hint.classes().join(' ')).toContain('bg-white/[0.03]')

    const table = wrapper.get('[data-test-id="remote-task-management.packages.table"]')
    expect(table.classes().join(' ')).toContain('bg-transparent')
  })
})
