<script setup lang="ts">
import { ref } from 'vue'
import { Button, Input, Label } from '@mcplinx/ui-vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { remoteTaskManagementPageTestId, useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const pageTestId = remoteTaskManagementPageTestId(runtime, 'deploy')
const name = ref('')
const version = ref('')
const instanceId = ref('')
const loading = ref(false)
const error = ref('')
const result = ref<Awaited<ReturnType<typeof runtime.facade.deploy>> | null>(null)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    result.value = await runtime.facade.deploy({
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
  <BundlePage :data-test-id="pageTestId" :title="runtime.t('remoteTaskManagement.deploy.title', 'Deploy')" :description="runtime.t('remoteTaskManagement.deploy.description', 'Use the same deployment form across every admin host.')">
    <BundlePanel class="space-y-4">
      <Label class="grid gap-2"><span class="text-sm font-medium text-slate-700">{{ runtime.t('remoteTaskManagement.common.packageName', 'Package name') }}</span><Input v-model="name" data-test-id="remote-task-management.deploy.name" class="border border-slate-300 bg-white text-slate-900" /></Label>
      <Label class="grid gap-2"><span class="text-sm font-medium text-slate-700">{{ runtime.t('remoteTaskManagement.common.version', 'Version') }}</span><Input v-model="version" data-test-id="remote-task-management.deploy.version" class="border border-slate-300 bg-white text-slate-900" /></Label>
      <Label class="grid gap-2"><span class="text-sm font-medium text-slate-700">{{ runtime.t('remoteTaskManagement.common.instanceId', 'Instance ID') }}</span><Input v-model="instanceId" data-test-id="remote-task-management.deploy.instance" class="border border-slate-300 bg-white text-slate-900" /></Label>
      <Button data-test-id="remote-task-management.deploy.submit" :disabled="loading" @click="submit">{{ runtime.t('remoteTaskManagement.deploy.submit', 'Deploy') }}</Button>
    </BundlePanel>
    <BundleState v-if="error" variant="error" :message="error" />
    <BundlePanel v-if="result">
      <pre data-test-id="remote-task-management.deploy.result" class="overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{{ JSON.stringify(result, null, 2) }}</pre>
    </BundlePanel>
  </BundlePage>
</template>
