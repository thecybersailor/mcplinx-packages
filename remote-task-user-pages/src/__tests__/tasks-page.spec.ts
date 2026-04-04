import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView, type RouteRecordRaw } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
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
    deleteConnection: vi.fn(async () => ({})),
    reauthConnection: vi.fn(async () => ({})),
    listTasks: vi.fn(async (): Promise<RemoteTaskExecutionList> => ({
      executions: [{ id: 'task_1', action_name: 'Run sync', status: 'RUNNING' }],
    })),
    getTask: vi.fn(async () => ({ id: 'task_1', status: 'RUNNING', input: { ok: true } })),
    cancelTask: vi.fn(async () => ({})),
  }
}

describe('TasksPage', () => {
  it('loads tasks and navigates to task detail route', async () => {
    const facade = createFacade()
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
    await router.push('/integrations/tasks')
    await router.isReady()
    const wrapper = mount(defineComponent({ components: { RouterView }, template: '<RouterView />' }), {
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
    expect(facade.listTasks).toHaveBeenCalled()
    await wrapper.get('[data-test-id="remote-task-user.tasks.row.task_1"] button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('bundle-task-detail')
    expect(facade.getTask).toHaveBeenCalledWith('task_1')
    expect(wrapper.get('[data-test-id="remote-task-user.task-detail.json"]').text()).toContain('"task_1"')
  })
})
