import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { createConnectionAuthTaskRoutes } from '../routes'
import type { ConnectionAuthTaskFacade, ConnectionAuthTaskDetail } from '../facade'
import { replaceLocation } from '../navigation'

vi.mock('../navigation', () => ({
  replaceLocation: vi.fn(),
}))

async function mountAt(path: string, facade: ConnectionAuthTaskFacade) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: createConnectionAuthTaskRoutes({
      basePath: '/auth/connection-tasks',
      routePrefix: 'auth-connection-tasks',
      facade,
    }),
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(defineComponent(() => () => h(RouterView)), {
    global: {
      plugins: [router],
    },
  })
  await flushPromises()
  return { wrapper, router }
}

function detail(overrides: Partial<ConnectionAuthTaskDetail>): ConnectionAuthTaskDetail {
  return {
    task_id: 'cauth_1',
    status: 'awaiting_input',
    auth_type: 'api_key',
    connector: { id: 'gmail', name: 'Gmail' },
    fields: [{ key: 'api_key', label: 'API Key', type: 'password', required: true }],
    ...overrides,
  }
}

describe('AuthTaskPage', () => {
  it('redirects oauth tasks to provider url', async () => {
    const facade: ConnectionAuthTaskFacade = {
      getTask: vi.fn(async () => detail({ auth_type: 'oauth2', status: 'pending_oauth_redirect', provider_url: 'https://auth.example/start' })),
      submitTask: vi.fn(),
      completeCallback: vi.fn(),
    }

    await mountAt('/auth/connection-tasks/cauth_1', facade)

    expect(replaceLocation).toHaveBeenCalledWith('https://auth.example/start')
  })

  it('renders dynamic api_key fields with key-based payload', async () => {
    let currentStatus: ConnectionAuthTaskDetail['status'] = 'awaiting_input'
    const facade: ConnectionAuthTaskFacade = {
      getTask: vi.fn(async () => detail({ auth_type: 'api_key', status: currentStatus })),
      submitTask: vi.fn(async (_taskId, request) => {
        expect(request.auth_data).toEqual({ api_key: 'secret' })
        currentStatus = 'succeeded'
        return detail({ status: 'succeeded' })
      }),
      completeCallback: vi.fn(),
    }

    const { wrapper } = await mountAt('/auth/connection-tasks/cauth_1', facade)
    await wrapper.get('[data-test-id="connection-auth-task.field.api_key"]').setValue('secret')
    await wrapper.get('[data-test-id="connection-auth-task.form"]').trigger('submit')
    await flushPromises()
    expect(facade.submitTask).toHaveBeenCalled()
  })

  it('renders fixed basic auth fields', async () => {
    const facade: ConnectionAuthTaskFacade = {
      getTask: vi.fn(async () => detail({ auth_type: 'basic', fields: [] })),
      submitTask: vi.fn(async (_taskId, request) => {
        expect(request.auth_data).toEqual({ username: 'alice', password: 'secret' })
        return detail({ auth_type: 'basic', status: 'succeeded' })
      }),
      completeCallback: vi.fn(),
    }

    const { wrapper } = await mountAt('/auth/connection-tasks/cauth_1', facade)
    await wrapper.get('[data-test-id="connection-auth-task.field.username"]').setValue('alice')
    await wrapper.get('[data-test-id="connection-auth-task.field.password"]').setValue('secret')
    await wrapper.get('[data-test-id="connection-auth-task.form"]').trigger('submit')
    await flushPromises()

    expect(facade.submitTask).toHaveBeenCalled()
  })
})
