<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskUserRuntime } from '../facade'

const runtime = useRemoteTaskUserRuntime()
const route = useRoute()
const router = useRouter()
const label = ref('')
const loading = ref(false)
const error = ref('')
const createdId = ref('')
const connectorId = computed(() => String(route.params.id ?? route.query.connectorId ?? ''))

function nameOf(suffix: string) {
  return `${runtime.routePrefix}-${suffix}`
}

async function submit() {
  if (!connectorId.value) {
    error.value = 'Missing connector id'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const response = await runtime.facade.createConnection({
      connector_id: connectorId.value,
      label: label.value || undefined,
    })
    createdId.value = response.id || ''
    if (response.id) {
      await router.push({ name: nameOf('connection-detail'), params: { id: response.id } })
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BundlePage
    data-test-id="remote-task-user.connect.page"
    :title="runtime.t('remoteTaskUser.connectPage.title', 'Create connection')"
    :description="`Connector ID: ${connectorId || '-'}`"
  >
    <BundlePanel>
      <label class="grid gap-2">
        <span class="text-sm font-medium text-slate-700">{{ runtime.t('remoteTaskUser.connectPage.label', 'Connection label') }}</span>
        <input v-model="label" data-test-id="remote-task-user.connect.label" class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" />
      </label>
    </BundlePanel>

    <BundleState v-if="error" variant="error" :message="error" />
    <BundleState v-if="createdId" variant="loading" :message="`Connection created: ${createdId}`" />

    <button
      data-test-id="remote-task-user.connect.submit"
      class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      :disabled="loading"
      @click="submit"
    >
      {{ loading ? runtime.t('remoteTaskUser.common.loading', 'Loading...') : runtime.t('remoteTaskUser.connectPage.submit', 'Create connection') }}
    </button>
  </BundlePage>
</template>
