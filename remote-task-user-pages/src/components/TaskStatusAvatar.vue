<script setup lang="ts">
import { computed } from 'vue'
import { Avatar, AvatarFallback, Badge } from '@mcplinx/ui-vue'
import type { NormalizedTaskExecution } from './taskExecution'
import { isRunningTaskStatus, taskAvatarText, taskBadgeClass } from './taskExecution'

const props = defineProps<{
  task: NormalizedTaskExecution
}>()

const badgeClass = computed(() => taskBadgeClass(props.task.status))
</script>

<template>
  <div class="relative mr-5">
    <Avatar class="border border-border">
      <AvatarFallback>{{ taskAvatarText(task) }}</AvatarFallback>
    </Avatar>
    <Badge
      variant="outline"
      class="absolute bottom-0 right-0 h-4 min-w-4 rounded-full border-background bg-background p-0 text-[10px] shadow-sm"
    >
      <span
        v-if="isRunningTaskStatus(task.status)"
        class="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        :class="badgeClass"
      />
      <span
        v-else
        class="font-bold leading-none"
        :class="badgeClass"
      >
        <span v-if="task.status === 'SUCCEEDED' || task.status === 'COMPLETED'">✓</span>
        <span v-else-if="task.status === 'FAILED'">×</span>
        <span v-else-if="task.status === 'CANCELLED'">-</span>
        <span v-else>•</span>
      </span>
    </Badge>
  </div>
</template>
