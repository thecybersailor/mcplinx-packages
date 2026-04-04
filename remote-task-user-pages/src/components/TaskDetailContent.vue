<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@mcplinx/ui-vue'
import type { NormalizedTaskExecution } from './taskExecution'
import { formatTaskDate, taskStatusText, taskStatusVariant } from './taskExecution'
import TaskStatusAvatar from './TaskStatusAvatar.vue'

const props = defineProps<{
  task: NormalizedTaskExecution | null
  routePrefix: string
  t: (key: string, fallback: string) => string
}>()

const statusLabel = computed(() => taskStatusText(props.task?.status, props.t))
const statusVariant = computed(() => taskStatusVariant(props.task?.status))
</script>

<template>
  <div v-if="task" class="space-y-6">
    <div class="flex items-center gap-2 border-b border-border pb-4">
      <TaskStatusAvatar :task="task" />
      <div class="min-w-0 flex-1">
        <div class="truncate text-lg font-semibold text-foreground">{{ task.actionName || '-' }}</div>
        <div class="truncate text-sm text-muted-foreground">{{ task.connectorKey || '-' }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label class="text-sm font-medium text-muted-foreground">{{ t('remoteTaskUser.tasks.meta.id', 'ID') }}</label>
        <p class="text-sm font-mono text-foreground">{{ task.id ? task.id.substring(0, 7) : '-' }}</p>
      </div>
      <div>
        <label class="text-sm font-medium text-muted-foreground">{{ t('remoteTaskUser.tasks.meta.status', 'Status') }}</label>
        <div class="mt-1">
          <Badge :variant="statusVariant">{{ statusLabel }}</Badge>
        </div>
      </div>
      <div>
        <label class="text-sm font-medium text-muted-foreground">{{ t('remoteTaskUser.tasks.meta.connection', 'Connection') }}</label>
        <p class="text-sm text-foreground">
          <RouterLink
            v-if="task.connectionId"
            :to="{ name: `${routePrefix}-connection-detail`, params: { id: task.connectionId } }"
            class="text-primary hover:underline"
          >
            {{ task.connectionId }}
          </RouterLink>
          <span v-else>-</span>
        </p>
      </div>
      <div>
        <label class="text-sm font-medium text-muted-foreground">{{ t('remoteTaskUser.tasks.meta.createdAt', 'Created') }}</label>
        <p class="text-sm text-foreground">{{ formatTaskDate(task.createdAt) }}</p>
      </div>
      <div v-if="task.finishedAt">
        <label class="text-sm font-medium text-muted-foreground">{{ t('remoteTaskUser.tasks.meta.finishedAt', 'Finished') }}</label>
        <p class="text-sm text-foreground">{{ formatTaskDate(task.finishedAt) }}</p>
      </div>
      <div v-if="task.taskInfoURL">
        <label class="text-sm font-medium text-muted-foreground">{{ t('remoteTaskUser.tasks.meta.statusUrl', 'Status URL') }}</label>
        <p class="text-sm">
          <a
            :href="task.taskInfoURL"
            target="_blank"
            rel="noreferrer"
            class="break-all text-primary hover:underline"
          >
            {{ task.taskInfoURL }}
          </a>
        </p>
      </div>
    </div>

    <div v-if="task.externalTaskId" class="space-y-2">
      <h3 class="text-sm font-semibold text-foreground">{{ t('remoteTaskUser.tasks.externalTask.title', 'External Task') }}</h3>
      <div class="text-sm text-foreground">
        <label class="text-muted-foreground">{{ t('remoteTaskUser.tasks.externalTask.id', 'Task ID:') }}</label>
        <span class="ml-2">{{ task.externalTaskId }}</span>
      </div>
    </div>

    <div v-if="task.input" class="space-y-2">
      <h3 class="text-sm font-semibold text-foreground">{{ t('remoteTaskUser.tasks.input', 'Input') }}</h3>
      <pre class="overflow-x-auto rounded-md bg-muted p-4 text-sm text-foreground">{{ JSON.stringify(task.input, null, 2) }}</pre>
    </div>

    <div v-if="task.output" class="space-y-2">
      <h3 class="text-sm font-semibold text-foreground">{{ t('remoteTaskUser.tasks.result', 'Result') }}</h3>
      <pre class="overflow-x-auto rounded-md bg-muted p-4 text-sm text-foreground">{{ JSON.stringify(task.output, null, 2) }}</pre>
    </div>

    <div v-if="task.error" class="space-y-2">
      <h3 class="text-sm font-semibold text-destructive">{{ t('remoteTaskUser.tasks.error', 'Error') }}</h3>
      <pre class="overflow-x-auto rounded-md bg-destructive/10 p-4 text-sm text-destructive">{{ JSON.stringify(task.error, null, 2) }}</pre>
    </div>
  </div>
</template>
