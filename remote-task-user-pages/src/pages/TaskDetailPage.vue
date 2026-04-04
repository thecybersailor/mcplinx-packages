<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@mcplinx/ui-vue'
import TaskDetailContent from '../components/TaskDetailContent.vue'
import { useRemoteTaskUserRuntime } from '../facade'
import { isRunningTaskStatus, normalizeTaskExecution } from '../components/taskExecution'

const runtime = useRemoteTaskUserRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const canceling = ref(false)
const task = ref<Awaited<ReturnType<typeof runtime.facade.getTask>> | null>(null)
let pollTimer: ReturnType<typeof setTimeout> | null = null

const taskId = computed(() => String(route.params.id ?? '').trim())
const normalizedTask = computed(() => normalizeTaskExecution(task.value))

function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

async function loadTask() {
  if (!taskId.value) return
  loading.value = true
  error.value = ''
  try {
    task.value = await runtime.facade.getTask(taskId.value)
    if (isRunningTaskStatus(task.value?.status)) {
      startPolling()
    } else {
      stopPolling()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed')
    task.value = null
    stopPolling()
  } finally {
    loading.value = false
  }
}

async function pollOnce() {
  if (!taskId.value) return
  try {
    task.value = await runtime.facade.getTask(taskId.value)
  } catch {
    return
  }
}

function startPolling() {
  stopPolling()
  pollTimer = setTimeout(async () => {
    await pollOnce()
    if (isRunningTaskStatus(task.value?.status)) {
      startPolling()
    }
  }, 1500)
}

async function handleCancel() {
  if (!taskId.value || !window.confirm(runtime.t('remoteTaskUser.tasks.cancelConfirm', 'Are you sure you want to cancel this task?'))) {
    return
  }
  canceling.value = true
  try {
    await runtime.facade.cancelTask(taskId.value)
    await loadTask()
  } catch (err) {
    window.alert(err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed'))
  } finally {
    canceling.value = false
  }
}

onMounted(() => {
  void loadTask()
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<template>
  <div data-test-id="remote-task-user.task-detail.page" class="container mx-auto space-y-6 p-6 py-8">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-foreground">{{ runtime.t('remoteTaskUser.tasks.detail', 'Task detail') }}</h1>
      <div class="flex gap-2">
        <Button variant="outline" @click="loadTask">
          {{ runtime.t('remoteTaskUser.common.retry', 'Retry') }}
        </Button>
        <Button variant="outline" @click="router.push({ name: `${runtime.routePrefix}-tasks` })">
          {{ runtime.t('remoteTaskUser.common.backToList', 'Back to list') }}
        </Button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <span class="text-sm text-muted-foreground">{{ runtime.t('remoteTaskUser.common.loading', 'Loading...') }}</span>
    </div>

    <div v-else-if="error" class="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-destructive">
      <span>{{ error }}</span>
    </div>

    <div v-else-if="task" class="rounded-2xl border border-border bg-background p-6 shadow-sm">
      <TaskDetailContent
        :task="normalizedTask"
        :route-prefix="runtime.routePrefix"
        :t="runtime.t"
      />

      <div class="mt-6 flex justify-end gap-2 border-t border-border pt-4">
        <Button
          v-if="isRunningTaskStatus(task.status)"
          data-test-id="remote-task-user.task-detail.cancel"
          variant="destructive"
          :disabled="canceling"
          @click="handleCancel"
        >
          {{ runtime.t('remoteTaskUser.tasks.cancel', 'Cancel') }}
        </Button>
        <Button
          data-test-id="remote-task-user.task-detail.back"
          variant="outline"
          @click="router.push({ name: `${runtime.routePrefix}-tasks` })"
        >
          {{ runtime.t('remoteTaskUser.common.backToList', 'Back to list') }}
        </Button>
      </div>
    </div>
  </div>
</template>
