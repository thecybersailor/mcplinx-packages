<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskUserRuntime } from '../facade'

const runtime = useRemoteTaskUserRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const connector = ref<Awaited<ReturnType<typeof runtime.facade.getConnector>> | null>(null)
const tools = computed(() => connector.value?.tools ?? [])
const connectorId = computed(() => String(route.params.id ?? ''))

function nameOf(suffix: string) {
  return `${runtime.routePrefix}-${suffix}`
}

async function load() {
  if (!connectorId.value) return
  loading.value = true
  error.value = ''
  try {
    connector.value = await runtime.facade.getConnector(connectorId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed')
    connector.value = null
  } finally {
    loading.value = false
  }
}

function connect() {
  void router.push({ name: nameOf('connect'), params: { id: connectorId.value } })
}

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="remote-task-user.connector-detail.page"
    :title="connector?.package?.name || connector?.id || runtime.t('remoteTaskUser.connectors.title', 'Connectors')"
    :description="connector?.package?.package_description || ''"
  >
    <template #actions>
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="router.back()">
        {{ runtime.t('remoteTaskUser.connectorDetail.back', 'Back') }}
      </button>
    </template>

    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskUser.common.loading', 'Loading...')" />
    <BundleState v-else-if="error" variant="error" :message="error" />
    <div v-else-if="connector" class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <div class="space-y-4">
        <BundlePanel>
          <h2 class="mb-3 text-base font-semibold text-slate-950">Connector Information</h2>
          <dl class="grid gap-3 md:grid-cols-2">
            <div>
              <dt class="text-xs uppercase tracking-wide text-slate-400">Name</dt>
              <dd class="mt-1 text-sm text-slate-800">{{ connector.package?.name || connector.id || '-' }}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-slate-400">{{ runtime.t('remoteTaskUser.connectorDetail.version', 'Version') }}</dt>
              <dd class="mt-1 text-sm text-slate-800">{{ connector.version || '-' }}</dd>
            </div>
            <div class="md:col-span-2">
              <dt class="text-xs uppercase tracking-wide text-slate-400">Description</dt>
              <dd class="mt-1 text-sm text-slate-800">{{ connector.package?.package_description || '-' }}</dd>
            </div>
          </dl>
        </BundlePanel>

        <BundlePanel>
          <h2 class="mb-3 text-base font-semibold text-slate-950">Available Tools</h2>
          <div v-if="tools.length" class="space-y-3">
            <div v-for="tool in tools" :key="String(tool.name ?? tool.id ?? tool.description ?? 'tool')" class="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="text-sm font-semibold text-slate-950">{{ String(tool.name ?? tool.id ?? 'Tool') }}</div>
                <span class="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">{{ String(tool.kind ?? 'tool') }}</span>
              </div>
              <p class="mt-2 text-sm leading-6 text-slate-600">{{ String(tool.description ?? 'No description available') }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-slate-500">No tools published for this connector yet.</p>
        </BundlePanel>
      </div>

      <div class="space-y-4">
        <BundlePanel>
          <h2 class="mb-3 text-base font-semibold text-slate-950">Actions</h2>
          <button data-test-id="remote-task-user.connector-detail.connect" class="inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" @click="connect">
            {{ runtime.t('remoteTaskUser.connectors.connect', 'Connect') }}
          </button>
        </BundlePanel>

        <BundlePanel>
          <h2 class="mb-3 text-base font-semibold text-slate-950">Metadata</h2>
          <dl class="grid gap-3">
            <div>
              <dt class="text-xs uppercase tracking-wide text-slate-400">{{ runtime.t('remoteTaskUser.connectorDetail.createdAt', 'Created') }}</dt>
              <dd class="mt-1 text-sm text-slate-800">{{ connector.created_at || '-' }}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-slate-400">{{ runtime.t('remoteTaskUser.connectorDetail.updatedAt', 'Updated') }}</dt>
              <dd class="mt-1 text-sm text-slate-800">{{ connector.updated_at || '-' }}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-slate-400">Connector ID</dt>
              <dd class="mt-1 break-all text-sm text-slate-800">{{ connector.id || '-' }}</dd>
            </div>
          </dl>
        </BundlePanel>
      </div>
    </div>
  </BundlePage>
</template>
