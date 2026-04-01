<script setup lang="ts">
import { ref } from 'vue'
import { Button, Input, Label } from '@mcplinx/ui-vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { remoteTaskManagementPageTestId, useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const pageTestId = remoteTaskManagementPageTestId(runtime, 'publish')
const name = ref('')
const files = ref('bundle.tgz')
const loading = ref(false)
const error = ref('')
const uploadUrls = ref<Record<string, string>>({})
const publishResult = ref<Record<string, unknown>>({})

async function createUploadUrls() {
  loading.value = true
  error.value = ''
  try {
    const response = await runtime.facade.createUploadUrls({
      name: name.value,
      files: files.value.split(',').map(item => item.trim()).filter(Boolean),
    })
    uploadUrls.value = response.upload_urls ?? {}
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
  } finally {
    loading.value = false
  }
}

async function publish() {
  loading.value = true
  error.value = ''
  try {
    publishResult.value = await runtime.facade.publish({ name: name.value })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BundlePage :data-test-id="pageTestId" :title="runtime.t('remoteTaskManagement.publish.title', 'Publish')" :description="runtime.t('remoteTaskManagement.publish.description', 'Use one shared publish form across platform and tenant hosts.')">
    <BundlePanel class="space-y-4">
      <Label class="grid gap-2"><span class="text-sm font-medium text-foreground">{{ runtime.t('remoteTaskManagement.common.packageName', 'Package name') }}</span><Input v-model="name" data-test-id="remote-task-management.publish.name" class="border border-input bg-background text-foreground" /></Label>
      <Label class="grid gap-2"><span class="text-sm font-medium text-foreground">{{ runtime.t('remoteTaskManagement.publish.files', 'Files') }}</span><Input v-model="files" data-test-id="remote-task-management.publish.files" class="border border-input bg-background text-foreground" /></Label>
      <div class="flex flex-wrap gap-2">
        <Button data-test-id="remote-task-management.publish.upload-url" variant="outline" :disabled="loading" @click="createUploadUrls">{{ runtime.t('remoteTaskManagement.publish.getUploadUrls', 'Get Upload URLs') }}</Button>
        <Button data-test-id="remote-task-management.publish.submit" :disabled="loading" @click="publish">{{ runtime.t('remoteTaskManagement.publish.submit', 'Publish') }}</Button>
      </div>
    </BundlePanel>
    <BundleState v-if="error" variant="error" :message="error" />
    <BundlePanel v-if="Object.keys(uploadUrls).length">
      <pre data-test-id="remote-task-management.publish.upload-urls" class="overflow-auto rounded-xl border border-border bg-muted p-4 text-xs text-foreground">{{ JSON.stringify(uploadUrls, null, 2) }}</pre>
    </BundlePanel>
    <BundlePanel v-if="Object.keys(publishResult).length">
      <pre data-test-id="remote-task-management.publish.result" class="overflow-auto rounded-xl border border-border bg-muted p-4 text-xs text-foreground">{{ JSON.stringify(publishResult, null, 2) }}</pre>
    </BundlePanel>
  </BundlePage>
</template>
