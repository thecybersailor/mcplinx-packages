<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConnectionAuthTaskRuntime } from '../facade'
import { emitAuthTaskTerminalEvent, terminalEventFromDetail } from '../authTaskEvents'
import { bestEffortCloseWindow } from '../windowClose'

const runtime = useConnectionAuthTaskRuntime()
const route = useRoute()
const router = useRouter()
const title = ref('')
const error = ref('')

onMounted(async () => {
  const taskId = String(route.params.taskId ?? '')
  try {
    const detail = await runtime.facade.getTask(taskId)
    title.value = detail.connection_label || detail.connector?.name || ''
    if (detail.status !== 'succeeded') {
      await router.replace({ name: `${runtime.routePrefix}-detail`, params: { taskId } })
      return
    }
    const event = terminalEventFromDetail(detail)
    if (event) emitAuthTaskTerminalEvent(event)
    bestEffortCloseWindow()
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('connectionAuthTask.common.error', 'Request failed.')
  }
})
</script>

<template>
  <section data-test-id="connection-auth-task.success.page" class="mx-auto max-w-2xl space-y-4 px-6 py-10 text-foreground">
    <h1 class="text-2xl font-semibold">{{ runtime.t('connectionAuthTask.success.title', 'Authentication Successful') }}</h1>
    <p class="text-sm text-muted-foreground">
      {{ title || runtime.t('connectionAuthTask.success.subtitle', 'The connection authorization is complete.') }}
    </p>
    <div v-if="error" class="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {{ error }}
    </div>
    <div class="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
      {{ runtime.t('connectionAuthTask.success.closeHint', 'Authentication successful. You can close this page.') }}
    </div>
  </section>
</template>
