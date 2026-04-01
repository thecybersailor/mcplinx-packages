<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@mcplinx/ui-vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskUserRuntime } from '../facade'

const runtime = useRemoteTaskUserRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const canceling = ref(false)
const error = ref('')
const task = ref<Awaited<ReturnType<typeof runtime.facade.getTask>> | null>(null)
const taskId = computed(() => String(route.params.id ?? ''))

async function load() {
  if (!taskId.value) return
  loading.value = true
  error.value = ''
  try {
    task.value = await runtime.facade.getTask(taskId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed')
    task.value = null
  } finally {
    loading.value = false
  }
}

async function cancelTask() {
  if (!taskId.value) return
  canceling.value = true
  try {
    await runtime.facade.cancelTask(taskId.value)
    await load()
  } finally {
    canceling.value = false
  }
}

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="remote-task-user.task-detail.page"
    :title="runtime.t('remoteTaskUser.tasks.detail', 'Task detail')"
    :description="task?.action_name || task?.action_key || task?.id || ''"
  >
    <template #actions>
      <Button
        data-test-id="remote-task-user.task-detail.back"
        variant="outline"
        @click="router.push({ name: `${runtime.routePrefix}-tasks` })"
      >
        {{ runtime.t('remoteTaskUser.common.backToList', 'Back to list') }}
      </Button>
    </template>

    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskUser.common.loading', 'Loading...')" />
    <BundleState v-else-if="error" variant="error" :message="error" />
    <div v-else-if="task" class="space-y-4">
      <BundlePanel>
        <dl class="grid gap-3 md:grid-cols-2">
          <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">ID</dt><dd class="mt-1 text-sm text-foreground">{{ task.id || '-' }}</dd></div>
          <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Status</dt><dd class="mt-1 text-sm text-foreground">{{ task.status || '-' }}</dd></div>
          <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Action</dt><dd class="mt-1 text-sm text-foreground">{{ task.action_name || task.action_key || '-' }}</dd></div>
          <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Created</dt><dd class="mt-1 text-sm text-foreground">{{ task.created_at || '-' }}</dd></div>
        </dl>
      </BundlePanel>

      <BundlePanel>
        <pre data-test-id="remote-task-user.task-detail.json" class="overflow-auto rounded-xl border border-border bg-muted p-4 font-mono text-xs text-foreground">{{ JSON.stringify(task, null, 2) }}</pre>
      </BundlePanel>

      <Button
        data-test-id="remote-task-user.task-detail.cancel"
        variant="destructive"
        :disabled="canceling"
        @click="cancelTask"
      >
        {{ canceling ? runtime.t('remoteTaskUser.tasks.canceling', 'Canceling...') : runtime.t('remoteTaskUser.tasks.cancel', 'Cancel') }}
      </Button>
    </div>
  </BundlePage>
</template>
