<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskSharedConnectionRuntime, type SharedConnectionRecord } from '../facade'

const runtime = useRemoteTaskSharedConnectionRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const rows = ref<SharedConnectionRecord[]>([])

const title = computed(() => runtime.t('sharedConnections.title', 'Shared Connections'))
const connectorId = computed(() => {
  const value = route.query.connector_id
  return typeof value === 'string' ? value : ''
})

async function load() {
  loading.value = true
  try {
    const response = await runtime.facade.listConnections({
      scope: runtime.scope,
      connector_id: connectorId.value || undefined,
    })
    rows.value = response.items ?? []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="shared-connections.page"
    :title="title"
    :description="runtime.t('sharedConnections.scope', 'Scope: {scope}', { scope: runtime.scope })"
  >
    <template #actions>
      <button
        class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        data-test-id="shared-connections.fallback-link"
        @click="router.push({ name: `${runtime.routePrefix}-fallback-explain` })"
      >
        {{ runtime.t('sharedConnections.fallback', 'Fallback Explain') }}
      </button>
      <button
        class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        data-test-id="shared-connections.create-link"
        @click="router.push({ name: `${runtime.routePrefix}-create`, query: connectorId ? { connector_id: connectorId } : undefined })"
      >
        {{ runtime.t('sharedConnections.create', 'Create Connection') }}
      </button>
    </template>

    <BundleState
      v-if="loading"
      variant="loading"
      :message="runtime.t('sharedConnections.loading', 'Loading shared connections...')"
      data-test-id="shared-connections.loading"
    />

    <BundleState
      v-else-if="!rows.length"
      variant="empty"
      :message="runtime.t('sharedConnections.empty', 'No shared connections found.')"
      data-test-id="shared-connections.empty"
    />

    <div v-else class="grid gap-3">
      <BundlePanel
        v-for="item in rows"
        :key="item.id"
        :data-test-id="`shared-connections.row.${item.id}`"
      >
        <button class="flex w-full items-start justify-between gap-4 text-left" @click="router.push({ name: `${runtime.routePrefix}-detail`, params: { id: item.id } })">
          <div class="space-y-1">
            <div class="font-semibold text-slate-950">{{ item.label || item.connector_id || item.id }}</div>
            <div class="text-sm leading-6 text-slate-500">{{ item.principal_pattern || runtime.t('sharedConnections.noPrincipal', 'No principal pattern') }}</div>
          </div>
          <div class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">{{ item.scope || runtime.scope }}</div>
        </button>
      </BundlePanel>
    </div>
  </BundlePage>
</template>
