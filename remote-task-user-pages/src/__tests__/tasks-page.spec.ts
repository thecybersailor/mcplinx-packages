import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView, type RouteRecordRaw } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRemoteTaskUserRoutes } from '../routes'
import {
  defaultTranslate,
  remoteTaskUserRuntimeKey,
  type RemoteTaskExecutionList,
  type RemoteTaskUserFacade,
} from '../facade'

function createFacade(): RemoteTaskUserFacade {
  return {
    listConnectors: vi.fn(async () => ({ connectors: [] })),
    getConnector: vi.fn(async () => ({ id: 'connector_1' })),
    listConnections: vi.fn(async () => ({ connections: [] })),
    createConnection: vi.fn(async () => ({ id: 'connection_1' })),
    getConnection: vi.fn(async () => ({ id: 'connection_1' })),
    getConnectionAction: vi.fn(async () => ({ action_key: 'sync_transform' })),
    executeConnectionAction: vi.fn(async () => ({ execution_id: 'exec_1' })),
    deleteConnection: vi.fn(async () => ({})),
    reauthConnection: vi.fn(async () => ({})),
    listTasks: vi.fn(async (): Promise<RemoteTaskExecutionList> => ({
      executions: [{ id: 'task_1', action_name: 'Run sync', status: 'RUNNING' }],
    })),
    getTask: vi.fn(async () => ({ id: 'task_1', action_name: 'Run sync', status: 'RUNNING', input: { ok: true } })),
    cancelTask: vi.fn(async () => ({})),
    deleteTask: vi.fn(async () => ({})),
  }
}

async function mountAt(path: string, facade: RemoteTaskUserFacade) {
  const [route] = createRemoteTaskUserRoutes({
    basePath: 'integrations',
    routePrefix: 'bundle',
    facade,
    authTaskFacade: {
      getTask: vi.fn(),
      submitTask: vi.fn(),
      completeCallback: vi.fn(),
    },
  }) as unknown as RouteRecordRaw[]
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        component: defineComponent({ components: { RouterView }, template: '<RouterView />' }),
        children: [route!],
      },
    ],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(defineComponent({ components: { RouterView }, template: '<RouterView />' }), {
    attachTo: document.body,
    global: {
      plugins: [router],
      provide: {
        [remoteTaskUserRuntimeKey as symbol]: {
          facade,
          authTaskFacade: {
            getTask: vi.fn(),
            submitTask: vi.fn(),
            completeCallback: vi.fn(),
          },
          routePrefix: 'bundle',
          t: defaultTranslate,
        },
      },
    },
  })

  await flushPromises()
  return { wrapper, router }
}

describe('TasksPage', () => {
  beforeEach(() => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    vi.stubGlobal('alert', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('loads tasks, opens detail dialog by row click, and cancels running task', async () => {
    const facade = createFacade()
    const { wrapper } = await mountAt('/integrations/tasks', facade)
    expect(facade.listTasks).toHaveBeenCalled()

    await wrapper.get('[data-test-id="remote-task-user.tasks.row.task_1"]').trigger('click')
    await flushPromises()

    expect(facade.getTask).toHaveBeenCalledWith('task_1')
    const taskDialog = document.body.querySelector('[data-test-id="remote-task-user.task-detail.dialog"]')
    expect(taskDialog).toBeTruthy()
    expect(taskDialog?.getAttribute('role')).toBe('dialog')

    const cancelButton = document.body.querySelector(
      '[data-test-id="remote-task-user.tasks.row.task_1.cancel"]',
    ) as HTMLButtonElement | null
    expect(cancelButton).toBeTruthy()
    cancelButton!.click()
    await flushPromises()

    expect(facade.cancelTask).toHaveBeenCalledWith('task_1')
  })

  it('closes completed task from list action by deleting execution', async () => {
    const facade = createFacade()
    facade.listTasks = vi.fn(async () => ({
      executions: [{ id: 'task_done_1', action_name: 'Cleanup', status: 'COMPLETED' }],
    }))

    const { wrapper } = await mountAt('/integrations/tasks', facade)

    await wrapper.get('[data-test-id="remote-task-user.tasks.row.task_done_1.close"]').trigger('click')
    await flushPromises()

    expect(facade.deleteTask).toHaveBeenCalledWith('task_done_1')
  })

  it('loads dedicated task detail route with the same task detail body', async () => {
    const facade = createFacade()
    const { wrapper, router } = await mountAt('/integrations/tasks/task_1', facade)

    expect(router.currentRoute.value.name).toBe('bundle-task-detail')
    expect(facade.getTask).toHaveBeenCalledWith('task_1')
    expect(wrapper.find('[data-test-id="remote-task-user.task-detail.page"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Run sync')
  })
})
