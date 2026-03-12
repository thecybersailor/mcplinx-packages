<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const configs = ref<Awaited<ReturnType<typeof runtime.facade.listConfigs>>>([])
const selectedId = ref('')
const editor = ref('{}')

async function load() {
  loading.value = true
  error.value = ''
  try {
    configs.value = await runtime.facade.listConfigs()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
    configs.value = []
  } finally {
    loading.value = false
  }
}

async function select(id?: string) {
  if (!id) return
  selectedId.value = id
  const record = await runtime.facade.getConfig(id)
  editor.value = JSON.stringify(record, null, 2)
}

async function save() {
  if (!selectedId.value) return
  saving.value = true
  error.value = ''
  try {
    const parsed = JSON.parse(editor.value) as Record<string, unknown>
    const updated = await runtime.facade.updateConfig(selectedId.value, parsed)
    editor.value = JSON.stringify(updated, null, 2)
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <BundlePage data-test-id="remote-task-management.config.page" title="Config" description="Shared connector configuration editor.">
    <template #actions>
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="load">Refresh</button>
    </template>
    <BundleState v-if="loading" variant="loading" message="Loading..." />
    <BundleState v-else-if="error" variant="error" :message="error" action-label="Refresh" @action="load" />
    <div v-else class="grid gap-4 lg:grid-cols-[1fr,2fr]">
      <BundlePanel class="overflow-hidden p-0">
        <div
          v-for="config in configs"
          :key="config.id"
          :data-test-id="`remote-task-management.config.row.${config.id}`"
          class="flex items-center justify-between border-b border-slate-200 px-4 py-3 last:border-b-0"
        >
          <div>
            <div class="font-medium text-slate-950">{{ config.name || config.id }}</div>
            <div class="text-sm text-slate-500">{{ config.status || '-' }}</div>
          </div>
          <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="select(config.id)">Edit</button>
        </div>
      </BundlePanel>
      <BundlePanel class="space-y-3">
        <div class="text-sm text-slate-500">Connector ID: {{ selectedId || '-' }}</div>
        <textarea v-model="editor" data-test-id="remote-task-management.config.editor" class="min-h-96 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900" />
        <button data-test-id="remote-task-management.config.save" class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" :disabled="saving || !selectedId" @click="save">
          {{ saving ? 'Saving...' : 'Save config' }}
        </button>
      </BundlePanel>
    </div>
  </BundlePage>
</template>
