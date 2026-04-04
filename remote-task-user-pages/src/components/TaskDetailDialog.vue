<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@mcplinx/ui-vue'
import { useRemoteTaskUserRuntime } from '../facade'
import TaskDetailContent from './TaskDetailContent.vue'
import { isRunningTaskStatus, normalizeTaskExecution } from './taskExecution'

const props = defineProps<{
  open: boolean
  executionId: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'task-updated': []
}>()

const runtime = useRemoteTaskUserRuntime()
const loading = ref(false)
const error = ref('')
const canceling = ref(false)
const task = ref<Awaited<ReturnType<typeof runtime.facade.getTask>> | null>(null)
let pollTimer: ReturnType<typeof setTimeout> | null = null

const normalizedTask = computed(() => normalizeTaskExecution(task.value))

function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

async function loadTaskDetail() {
  if (!props.executionId) return
  loading.value = true
  error.value = ''
  try {
    task.value = await runtime.facade.getTask(props.executionId)
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
  if (!props.executionId) return
  try {
    task.value = await runtime.facade.getTask(props.executionId)
  } catch {
    return
  }
}

function startPolling() {
  stopPolling()
  pollTimer = setTimeout(async () => {
    await pollOnce()
    if (props.open && isRunningTaskStatus(task.value?.status)) {
      startPolling()
    }
  }, 1500)
}

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

async function handleCancel() {
  if (!task.value || !window.confirm(runtime.t('remoteTaskUser.tasks.cancelConfirm', 'Are you sure you want to cancel this task?'))) {
    return
  }
  canceling.value = true
  try {
    await runtime.facade.cancelTask(normalizedTask.value.id || props.executionId)
    await loadTaskDetail()
    emit('task-updated')
  } catch (err) {
    window.alert(err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed'))
  } finally {
    canceling.value = false
  }
}

watch(() => props.open, (open) => {
  if (open && props.executionId) {
    void loadTaskDetail()
    return
  }
  stopPolling()
})

watch(() => props.executionId, (executionId) => {
  if (props.open && executionId) {
    void loadTaskDetail()
  }
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<template>
  <Sheet :open="open" @update:open="handleOpenChange">
    <SheetContent
      side="right"
      class="w-full sm:max-w-3xl"
      data-test-id="remote-task-user.task-detail.dialog"
    >
      <SheetHeader>
        <SheetTitle>{{ runtime.t('remoteTaskUser.tasks.detail', 'Task detail') }}</SheetTitle>
        <SheetDescription>
          {{ runtime.t('remoteTaskUser.tasks.detailDescription', 'Inspect execution state, input, result, and error details.') }}
        </SheetDescription>
      </SheetHeader>

      <div class="mt-4 space-y-4 overflow-y-auto pr-1">
        <div v-if="loading" class="flex justify-center py-8">
          <span class="text-sm text-muted-foreground">{{ runtime.t('remoteTaskUser.common.loading', 'Loading...') }}</span>
        </div>

        <div v-else-if="error" class="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <span>{{ error }}</span>
        </div>

        <TaskDetailContent
          v-else-if="task"
          :task="normalizedTask"
          :route-prefix="runtime.routePrefix"
          :t="runtime.t"
        />
      </div>

      <SheetFooter class="mt-6">
        <Button
          v-if="task && isRunningTaskStatus(task.status)"
          data-test-id="remote-task-user.task-detail.dialog.cancel"
          variant="destructive"
          :disabled="canceling"
          @click="handleCancel"
        >
          {{ runtime.t('remoteTaskUser.tasks.cancel', 'Cancel') }}
        </Button>
        <Button
          data-test-id="remote-task-user.task-detail.dialog.close"
          variant="outline"
          @click="handleOpenChange(false)"
        >
          {{ runtime.t('remoteTaskUser.tasks.close', 'Close') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
