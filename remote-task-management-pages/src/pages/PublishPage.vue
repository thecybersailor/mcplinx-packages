<script setup lang="ts">
import { ref } from 'vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
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
  <BundlePage data-test-id="remote-task-management.publish.page" title="Publish" description="Use one shared publish form across platform and tenant hosts.">
    <BundlePanel class="space-y-4">
      <label class="grid gap-2"><span class="text-sm font-medium text-slate-700">Package name</span><input v-model="name" data-test-id="remote-task-management.publish.name" class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label>
      <label class="grid gap-2"><span class="text-sm font-medium text-slate-700">Files</span><input v-model="files" data-test-id="remote-task-management.publish.files" class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label>
      <div class="flex flex-wrap gap-2">
        <button data-test-id="remote-task-management.publish.upload-url" class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" :disabled="loading" @click="createUploadUrls">Get Upload URLs</button>
        <button data-test-id="remote-task-management.publish.submit" class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" :disabled="loading" @click="publish">Publish</button>
      </div>
    </BundlePanel>
    <BundleState v-if="error" variant="error" :message="error" />
    <BundlePanel v-if="Object.keys(uploadUrls).length">
      <pre data-test-id="remote-task-management.publish.upload-urls" class="overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{{ JSON.stringify(uploadUrls, null, 2) }}</pre>
    </BundlePanel>
    <BundlePanel v-if="Object.keys(publishResult).length">
      <pre data-test-id="remote-task-management.publish.result" class="overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{{ JSON.stringify(publishResult, null, 2) }}</pre>
    </BundlePanel>
  </BundlePage>
</template>
