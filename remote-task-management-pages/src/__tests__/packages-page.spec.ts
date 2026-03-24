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

describe('PackagesPage', () => {
  it('keeps the packages entry focused on filters and table structure from checklist', async () => {
    const { wrapper } = await mountAt('/team/team_1/connectors/packages', 'team')

    expect(wrapper.text()).toContain('Connector Packages')
    expect(wrapper.text()).toContain('Application')
    expect(wrapper.text()).toContain('Author')
    expect(wrapper.text()).toContain('Version')
    expect(wrapper.text()).toContain('Tools')
    expect(wrapper.find('[data-test-id="remote-task-management.packages.cli-hint"]').exists()).toBe(false)
    const actionTexts = wrapper.findAll('button').map((node) => node.text())
    expect(actionTexts).not.toContain('CLI Hint')
    expect(actionTexts).not.toContain('Publish')
    expect(actionTexts).not.toContain('Deploy')
    expect(actionTexts).not.toContain('Config')
  })

  it('keeps status filter visible for tenant scope', async () => {
    const { wrapper } = await mountAt('/connectors/packages', 'tenant')
    expect(wrapper.find('[data-test-id="remote-task-management.packages.status"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Application')
  })

  it('uses dark bundle surfaces instead of light borders on packages page', async () => {
    const { wrapper } = await mountAt('/team/team_1/connectors/packages', 'team')

    const page = wrapper.get('[data-test-id="remote-task-management.packages.page"]')
    expect(page.classes().join(' ')).toContain('bg-transparent')
    expect(page.classes().join(' ')).toContain('border-transparent')

    const table = wrapper.get('[data-test-id="remote-task-management.packages.table"]')
    expect(table.classes().join(' ')).toContain('bg-transparent')

    const row = wrapper.get('[data-test-id="remote-task-management.packages.row.pkg_1"]')
    expect(row.classes().join(' ')).toContain('border-white/10')
  })
})
