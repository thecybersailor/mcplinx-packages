<script setup lang="ts">
import { ref } from 'vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const name = ref('')
const version = ref('')
const instanceId = ref('')
const loading = ref(false)
const error = ref('')
const result = ref<Awaited<ReturnType<typeof runtime.facade.rollback>> | null>(null)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    result.value = await runtime.facade.rollback({
      name: name.value,
      version: version.value,
      instance_id: instanceId.value || undefined,
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
    result.value = null
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BundlePage data-test-id="remote-task-management.rollback.page" title="Rollback" description="Rollback keeps the same contract as deploy, but always targets an older version.">
    <BundlePanel class="space-y-4">
      <label class="grid gap-2"><span class="text-sm font-medium text-slate-700">Package name</span><input v-model="name" data-test-id="remote-task-management.rollback.name" class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label>
      <label class="grid gap-2"><span class="text-sm font-medium text-slate-700">Version</span><input v-model="version" data-test-id="remote-task-management.rollback.version" class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label>
      <label class="grid gap-2"><span class="text-sm font-medium text-slate-700">Instance ID</span><input v-model="instanceId" data-test-id="remote-task-management.rollback.instance" class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label>
      <button data-test-id="remote-task-management.rollback.submit" class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" :disabled="loading" @click="submit">Rollback</button>
    </BundlePanel>
    <BundleState v-if="error" variant="error" :message="error" />
    <BundlePanel v-if="result">
      <pre data-test-id="remote-task-management.rollback.result" class="overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{{ JSON.stringify(result, null, 2) }}</pre>
    </BundlePanel>
  </BundlePage>
</template>
