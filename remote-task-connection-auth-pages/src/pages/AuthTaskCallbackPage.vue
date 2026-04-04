<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConnectionAuthTaskRuntime } from '../facade'

const runtime = useConnectionAuthTaskRuntime()
const route = useRoute()
const router = useRouter()
const error = ref('')

function queryRecord() {
  const record: Record<string, string> = {}
  for (const [key, value] of Object.entries(route.query)) {
    if (typeof value === 'string') record[key] = value
  }
  return record
}

onMounted(async () => {
  const taskId = String(route.params.taskId ?? '')
  try {
    const detail = await runtime.facade.completeCallback(taskId, {
      query: queryRecord(),
      hash: typeof window !== 'undefined' ? window.location.hash : '',
      full_url: typeof window !== 'undefined' ? window.location.href : route.fullPath,
    })
    if (detail.status === 'succeeded') {
      await router.replace({ name: `${runtime.routePrefix}-success`, params: { taskId } })
      return
    }
    await router.replace({ name: `${runtime.routePrefix}-detail`, params: { taskId } })
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('connectionAuthTask.common.error', 'Request failed.')
  }
})
</script>

<template>
  <section data-test-id="connection-auth-task.callback.page" class="mx-auto max-w-2xl space-y-4 px-6 py-10 text-foreground">
    <h1 class="text-2xl font-semibold">{{ runtime.t('connectionAuthTask.callback.title', 'Finishing Authentication') }}</h1>
    <p v-if="!error" class="text-sm text-muted-foreground">{{ runtime.t('connectionAuthTask.callback.loading', 'Please wait while we process the authorization callback...') }}</p>
    <div v-else data-test-id="connection-auth-task.callback.error" class="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {{ error }}
    </div>
  </section>
</template>
