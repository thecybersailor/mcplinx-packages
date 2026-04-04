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

const PACKAGE_UUID = 'bd8f5828-62f4-5066-8893-d46ecd02a5c2'

function createFacade(): RemoteTaskManagementFacade {
  return {
    listPackages: vi.fn(async () => []),
    getPackage: vi.fn(async () => ({ id: 1 })),
    listPackageVersions: vi.fn(async () => []),
    listPackageInstances: vi.fn(async () => []),
    listInstances: vi.fn(async () => []),
    createInstance: vi.fn(async () => ({ id: 9 })),
    createConnectionForInstance: vi.fn(async () => ({ id: 'conn_1', connector_id: '7' })),
    getInstance: vi.fn(async () =>
      ({
        id: 7,
        name: 'Tenant Slack',
        status: 'active',
        visibility: 'tenant',
        activeVersion: '1.2.3',
        pkg_id: PACKAGE_UUID,
        envConfig: { CLIENT_ID: 'initial-client' },
        secretConfig: { CLIENT_SECRET: true },
      }) as never,
    ),
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
      default: 'tenant',
    },
    routePrefix: {
      type: String,
      default: 'tenant-remote-task',
    },
  },
  setup(props) {
    const route = useRoute()
    provide(remoteTaskManagementRuntimeKey, {
      facade: props.facade,
      scope: props.scope,
      routePrefix: props.routePrefix,
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

  it('saves env_config and secret_config as separate fields', async () => {
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

    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBeGreaterThanOrEqual(4)

    await inputs[0]!.setValue('CLIENT_ID')
    await inputs[1]!.setValue('updated-client')
    await inputs[2]!.setValue('CLIENT_SECRET')
    await inputs[3]!.setValue('updated-secret')

    const saveButton = wrapper.findAll('button').find((button) => button.text().includes('Save Changes'))
    expect(saveButton).toBeTruthy()
    await saveButton!.trigger('click')
    await flushPromises()

    expect(facade.updateInstance).toHaveBeenCalledWith('7', {
      pkg_id: PACKAGE_UUID,
      name: 'Tenant Slack',
      active_version: '1.2.3',
      description: undefined,
      visibility: 'tenant',
      env_config: {
        CLIENT_ID: 'updated-client',
      },
      secret_config: {
        CLIENT_SECRET: 'updated-secret',
      },
    })
  })

  it('keeps key inputs mounted while editing variable and secret names', async () => {
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

    const initialInputs = wrapper.findAll('input')
    const envKeyInput = initialInputs[0]
    const secretKeyInput = initialInputs[2]

    expect(envKeyInput).toBeTruthy()
    expect(secretKeyInput).toBeTruthy()

    const envKeyElement = envKeyInput!.element
    const secretKeyElement = secretKeyInput!.element

    await envKeyInput!.setValue('RENAMED_CLIENT_ID')
    await flushPromises()
    expect(wrapper.findAll('input')[0]!.element).toBe(envKeyElement)

    await wrapper.findAll('input')[2]!.setValue('RENAMED_CLIENT_SECRET')
    await flushPromises()
    expect(wrapper.findAll('input')[2]!.element).toBe(secretKeyElement)
  })

  it('shows connect action for team scope and creates connection from canonical instance detail', async () => {
    const facade = createFacade()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/instances/:instanceId',
          component: RuntimeProvider,
          props: { facade, scope: 'team', routePrefix: 'team-remote-task' },
          children: [{ path: '', component: InstanceDetailPage }],
        },
        {
          path: '/connections/:id',
          component: defineComponent({ template: '<div data-test-id="connection-detail-page" />' }),
          name: 'team-remote-task-connection-detail',
        },
      ],
    })

    await router.push('/instances/7')
    await router.isReady()

    const wrapper = mount(defineComponent(() => () => h(RouterView)), {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()
    expect(wrapper.find('[data-test-id="remote-task-management.instance-detail.connect"]').exists()).toBe(true)
    await wrapper.get('[data-test-id="remote-task-management.instance-detail.connect"]').trigger('click')
    await flushPromises()
    expect(facade.createConnectionForInstance).toHaveBeenCalledWith('7')
    expect(router.currentRoute.value.name).toBe('team-remote-task-connection-detail')
  })
})
