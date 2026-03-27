<script setup lang="ts">
import { ref } from 'vue'
import { Button, Input, Label } from '@mcplinx/ui-vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { remoteTaskManagementPageTestId, useRemoteTaskManagementRuntime } from '../facade'

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
  <BundlePage :data-test-id="remoteTaskManagementPageTestId(runtime, 'rollback')" :title="runtime.t('remoteTaskManagement.rollback.title', 'Rollback')" :description="runtime.t('remoteTaskManagement.rollback.description', 'Rollback keeps the same contract as deploy, but always targets an older version.')">
    <BundlePanel class="space-y-4">
      <Label class="grid gap-2"><span class="text-sm font-medium text-slate-700">{{ runtime.t('remoteTaskManagement.common.packageName', 'Package name') }}</span><Input v-model="name" data-test-id="remote-task-management.rollback.name" class="border border-slate-300 bg-white text-slate-900" /></Label>
      <Label class="grid gap-2"><span class="text-sm font-medium text-slate-700">{{ runtime.t('remoteTaskManagement.common.version', 'Version') }}</span><Input v-model="version" data-test-id="remote-task-management.rollback.version" class="border border-slate-300 bg-white text-slate-900" /></Label>
      <Label class="grid gap-2"><span class="text-sm font-medium text-slate-700">{{ runtime.t('remoteTaskManagement.common.instanceId', 'Instance ID') }}</span><Input v-model="instanceId" data-test-id="remote-task-management.rollback.instance" class="border border-slate-300 bg-white text-slate-900" /></Label>
      <Button data-test-id="remote-task-management.rollback.submit" :disabled="loading" @click="submit">{{ runtime.t('remoteTaskManagement.rollback.submit', 'Rollback') }}</Button>
    </BundlePanel>
    <BundleState v-if="error" variant="error" :message="error" />
    <BundlePanel v-if="result">
      <pre data-test-id="remote-task-management.rollback.result" class="overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{{ JSON.stringify(result, null, 2) }}</pre>
    </BundlePanel>
  </BundlePage>
</template>
