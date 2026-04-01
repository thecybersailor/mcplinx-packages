<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Button } from '@mcplinx/ui-vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { remoteTaskManagementPageTestId, useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const pageTestId = remoteTaskManagementPageTestId(runtime, 'config')
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
  <BundlePage :data-test-id="pageTestId" :title="runtime.t('remoteTaskManagement.config.title', 'Config')" :description="runtime.t('remoteTaskManagement.config.description', 'Shared connector configuration editor.')">
    <template #actions>
      <Button variant="outline" @click="load">{{ runtime.t('remoteTaskManagement.common.refresh', 'Refresh') }}</Button>
    </template>
    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskManagement.common.loading', 'Loading...')" />
    <BundleState v-else-if="error" variant="error" :message="error" :action-label="runtime.t('remoteTaskManagement.common.refresh', 'Refresh')" @action="load" />
    <div v-else class="grid gap-4 lg:grid-cols-[1fr,2fr]">
      <BundlePanel class="overflow-hidden p-0">
        <div
          v-for="config in configs"
          :key="config.id"
          :data-test-id="`remote-task-management.config.row.${config.id}`"
          class="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0"
        >
          <div>
            <div class="font-medium text-foreground">{{ config.name || config.id }}</div>
            <div class="text-sm text-muted-foreground">{{ config.status || '-' }}</div>
          </div>
          <Button variant="outline" size="sm" @click="select(config.id)">{{ runtime.t('remoteTaskManagement.common.edit', 'Edit') }}</Button>
        </div>
      </BundlePanel>
      <BundlePanel class="space-y-3">
        <div class="text-sm text-muted-foreground">{{ runtime.t('remoteTaskManagement.config.connectorId', 'Connector ID') }}: {{ selectedId || '-' }}</div>
        <textarea v-model="editor" data-test-id="remote-task-management.config.editor" class="min-h-96 w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-xs text-foreground" />
        <Button data-test-id="remote-task-management.config.save" :disabled="saving || !selectedId" @click="save">
          {{ saving ? runtime.t('remoteTaskManagement.common.saving', 'Saving...') : runtime.t('remoteTaskManagement.config.saveConfig', 'Save config') }}
        </Button>
      </BundlePanel>
    </div>
  </BundlePage>
</template>
