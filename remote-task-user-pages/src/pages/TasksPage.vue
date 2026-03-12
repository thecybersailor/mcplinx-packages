<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskUserRuntime } from '../facade'

const runtime = useRemoteTaskUserRuntime()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const tasks = ref<Awaited<ReturnType<typeof runtime.facade.listTasks>>['executions']>([])

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await runtime.facade.listTasks()
    tasks.value = response.executions ?? []
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed')
    tasks.value = []
  } finally {
    loading.value = false
  }
}

function openTask(id?: string) {
  if (!id) return
  void router.push({ name: `${runtime.routePrefix}-task-detail`, params: { id } })
}

async function cancelTask(id?: string) {
  if (!id) return
  await runtime.facade.cancelTask(id)
  await load()
}

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="remote-task-user.tasks.page"
    :title="runtime.t('remoteTaskUser.tasks.title', 'Tasks')"
    description="Execution history uses the same review surface across all integrated hosts."
  >
    <template #actions>
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="load">
        {{ runtime.t('remoteTaskUser.common.retry', 'Retry') }}
      </button>
    </template>

    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskUser.common.loading', 'Loading...')" />
    <BundleState v-else-if="error" variant="error" :message="error" />
    <BundleState v-else-if="!tasks?.length" variant="empty" :message="runtime.t('remoteTaskUser.tasks.empty', 'No tasks yet.')" />
    <div v-else class="space-y-4">
      <div class="overflow-hidden rounded-2xl border border-slate-200">
        <table data-test-id="remote-task-user.tasks.table" class="min-w-full bg-white">
          <thead class="bg-slate-50 text-left text-sm text-slate-500">
            <tr>
              <th class="px-4 py-3 font-medium">Action</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Created</th>
              <th class="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in tasks" :key="task.id" :data-test-id="`remote-task-user.tasks.row.${task.id}`" class="border-t border-slate-200">
              <td class="px-4 py-4 font-medium text-slate-950">{{ task.action_name || task.action_key || task.id }}</td>
              <td class="px-4 py-4 text-slate-600">{{ task.status || '-' }}</td>
              <td class="px-4 py-4 text-slate-600">{{ task.created_at || '-' }}</td>
              <td class="px-4 py-4">
                <div class="flex flex-wrap gap-2">
                  <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="openTask(task.id)">{{ runtime.t('remoteTaskUser.tasks.detail', 'Task detail') }}</button>
                  <button class="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100" @click="cancelTask(task.id)">
                    {{ runtime.t('remoteTaskUser.tasks.cancel', 'Cancel') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </BundlePage>
</template>
