<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskSharedConnectionRuntime, type SharedConnectionFallbackExplainResponse } from '../facade'

const runtime = useRemoteTaskSharedConnectionRuntime()
const route = useRoute()
const router = useRouter()
const connectorId = ref(String(route.query.connector_id ?? ''))
const loading = ref(false)
const response = ref<SharedConnectionFallbackExplainResponse | null>(null)

async function load() {
  if (!connectorId.value) {
    response.value = null
    return
  }
  loading.value = true
  try {
    response.value = await runtime.facade.explainFallback({ connector_id: connectorId.value })
  } finally {
    loading.value = false
  }
}

async function submit() {
  await router.replace({ query: connectorId.value ? { connector_id: connectorId.value } : {} })
  await load()
}

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="shared-connections.fallback.page"
    :title="runtime.t('sharedConnections.fallback', 'Fallback Explain')"
    description="Inspect shared-connection resolution with the same workflow in every host."
  >
    <BundlePanel>
      <form class="flex items-center gap-2" @submit.prevent="submit">
        <input
          v-model="connectorId"
          class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
          :placeholder="runtime.t('sharedConnections.connectorId', 'Connector ID')"
          data-test-id="shared-connections.fallback.connector-id"
        >
        <button class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" data-test-id="shared-connections.fallback.submit">
          {{ runtime.t('sharedConnections.loadFallback', 'Load') }}
        </button>
      </form>
    </BundlePanel>

    <BundleState
      v-if="loading"
      variant="loading"
      :message="runtime.t('sharedConnections.loading', 'Loading shared connections...')"
      data-test-id="shared-connections.fallback.loading"
    />

    <div v-else-if="response" class="space-y-3">
      <BundlePanel v-if="response.selected" data-test-id="shared-connections.fallback.selected">
        <div class="text-xs uppercase tracking-wide text-slate-400">{{ runtime.t('sharedConnections.selected', 'Selected') }}</div>
        <div class="mt-2 font-semibold text-slate-950">{{ response.selected.label || response.selected.connector_id || response.selected.id }}</div>
      </BundlePanel>
      <div class="grid gap-3">
        <BundlePanel
          v-for="candidate in response.candidates ?? []"
          :key="candidate.id"
          :data-test-id="`shared-connections.fallback.candidate.${candidate.id}`"
        >
          <div class="font-semibold text-slate-950">{{ candidate.id }}</div>
          <div class="mt-1 text-sm leading-6 text-slate-500">{{ candidate.resolution_hint }}</div>
        </BundlePanel>
      </div>
    </div>
  </BundlePage>
</template>
