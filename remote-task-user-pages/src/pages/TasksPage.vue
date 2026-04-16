<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@mcplinx/ui-vue'
import { useRemoteTaskUserRuntime } from '../facade'
import TaskDetailDialog from '../components/TaskDetailDialog.vue'
import TaskStatusAvatar from '../components/TaskStatusAvatar.vue'
import {
  formatTaskDate,
  isRunningTaskStatus,
  normalizeTaskExecution,
} from '../components/taskExecution'

const runtime = useRemoteTaskUserRuntime()
const router = useRouter()
const tasks = ref<Awaited<ReturnType<typeof runtime.facade.listTasks>>['executions']>([])
const loading = ref(true)
const error = ref('')
const offset = ref(0)
const limit = ref(20)
const total = ref(0)
const showDetailDialog = ref(false)
const selectedTaskId = ref('')

async function loadTasks() {
  loading.value = true
  error.value = ''
  try {
    const response = await runtime.facade.listTasks({
      limit: limit.value,
      offset: offset.value,
    })
    tasks.value = response.executions ?? []
    total.value = Number(response.total ?? tasks.value.length)
    if (typeof response.limit === 'number' && response.limit > 0) {
      limit.value = response.limit
    }
    if (typeof response.offset === 'number' && response.offset >= 0) {
      offset.value = response.offset
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed')
    tasks.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function loadPage(nextOffset: number) {
  offset.value = Math.max(0, nextOffset)
  void loadTasks()
}

function openTaskDetail(taskId?: string) {
  if (!taskId) return
  selectedTaskId.value = taskId
  showDetailDialog.value = true
}

async function handleCancel(taskId?: string) {
  if (!taskId || !window.confirm(runtime.t('remoteTaskUser.tasks.cancelConfirm', 'Are you sure you want to cancel this task?'))) {
    return
  }
  try {
    await runtime.facade.cancelTask(taskId)
    await loadTasks()
  } catch (err) {
    window.alert(err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed'))
  }
}

async function handleClose(taskId?: string) {
  if (!taskId || !window.confirm(runtime.t('remoteTaskUser.tasks.closeConfirm', 'Are you sure you want to close this task?'))) {
    return
  }
  try {
    await runtime.facade.deleteTask(taskId)
    if (selectedTaskId.value === taskId) {
      showDetailDialog.value = false
      selectedTaskId.value = ''
    }
    await loadTasks()
  } catch (err) {
    window.alert(err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed'))
  }
}

onMounted(() => {
  void loadTasks()
})
</script>

<template>
  <div data-test-id="remote-task-user.tasks.page" class="container mx-auto space-y-6 p-6 py-8">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-foreground">{{ runtime.t('remoteTaskUser.tasks.title', 'Tasks') }}</h1>
      <div class="flex gap-2">
        <Button variant="outline" @click="loadTasks">
          {{ runtime.t('remoteTaskUser.common.retry', 'Retry') }}
        </Button>
        <Button variant="outline" @click="router.back()">
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

    <div v-else-if="(tasks?.length ?? 0) === 0" class="rounded-lg border-2 border-dashed border-border bg-muted/20 py-12 text-center">
      <p class="text-muted-foreground">{{ runtime.t('remoteTaskUser.tasks.empty', 'No tasks yet.') }}</p>
    </div>

    <div v-else class="rounded-md border border-border">
      <Table data-test-id="remote-task-user.tasks.table">
        <TableHeader>
          <TableRow>
            <TableHead>{{ runtime.t('remoteTaskUser.tasks.columns.tool', 'Tool') }}</TableHead>
            <TableHead>{{ runtime.t('remoteTaskUser.tasks.meta.createdAt', 'Created') }}</TableHead>
            <TableHead>{{ runtime.t('remoteTaskUser.tasks.meta.finishedAt', 'Finished') }}</TableHead>
            <TableHead>{{ runtime.t('remoteTaskUser.tasks.columns.actions', 'Actions') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="task in tasks"
            :key="task.id"
            :data-test-id="`remote-task-user.tasks.row.${task.id}`"
            class="cursor-pointer"
            @click="openTaskDetail(task.id)"
          >
            <TableCell>
              <div class="flex items-center gap-2">
                <TaskStatusAvatar :task="normalizeTaskExecution(task)" />
                <div class="min-w-0">
                  <div class="font-medium text-foreground">{{ normalizeTaskExecution(task).actionKey || normalizeTaskExecution(task).actionName || '-' }}</div>
                  <div class="text-sm text-muted-foreground">{{ normalizeTaskExecution(task).connectorKey || '-' }}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>{{ formatTaskDate(normalizeTaskExecution(task).createdAt) }}</TableCell>
            <TableCell>{{ formatTaskDate(normalizeTaskExecution(task).finishedAt) }}</TableCell>
            <TableCell @click.stop>
              <div class="flex gap-2">
                <Button
                  v-if="isRunningTaskStatus(task.status)"
                  :data-test-id="`remote-task-user.tasks.row.${task.id}.cancel`"
                  variant="destructive"
                  size="sm"
                  @click.stop="handleCancel(task.id)"
                >
                  {{ runtime.t('remoteTaskUser.tasks.cancel', 'Cancel') }}
                </Button>
                <Button
                  v-else
                  :data-test-id="`remote-task-user.tasks.row.${task.id}.close`"
                  variant="outline"
                  size="sm"
                  @click.stop="handleClose(task.id)"
                >
                  {{ runtime.t('remoteTaskUser.tasks.close', 'Close') }}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div v-if="total > limit" class="flex items-center justify-between">
      <div class="text-sm text-muted-foreground">
        {{
          runtime.t('remoteTaskUser.tasks.pagination.summary', 'Showing {from} to {to} of {total} tasks')
            .replace('{from}', String(offset + 1))
            .replace('{to}', String(Math.min(offset + limit, total)))
            .replace('{total}', String(total))
        }}
      </div>
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="offset === 0"
          @click="loadPage(offset - limit)"
        >
          {{ runtime.t('remoteTaskUser.tasks.pagination.previous', 'Previous') }}
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="offset + limit >= total"
          @click="loadPage(offset + limit)"
        >
          {{ runtime.t('remoteTaskUser.tasks.pagination.next', 'Next') }}
        </Button>
      </div>
    </div>

    <TaskDetailDialog
      v-model:open="showDetailDialog"
      :execution-id="selectedTaskId"
      @task-updated="loadTasks"
    />
  </div>
</template>
