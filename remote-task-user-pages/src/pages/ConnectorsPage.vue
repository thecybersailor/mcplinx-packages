<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskUserRuntime } from '../facade'

const runtime = useRemoteTaskUserRuntime()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const connectors = ref<Awaited<ReturnType<typeof runtime.facade.listConnectors>>['connectors']>([])

function nameOf(suffix: string) {
  return `${runtime.routePrefix}-${suffix}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await runtime.facade.listConnectors()
    connectors.value = response.connectors ?? []
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed')
    connectors.value = []
  } finally {
    loading.value = false
  }
}

function goToDetail(id?: string) {
  if (!id) return
  void router.push({ name: nameOf('connector-detail'), params: { id } })
}

function goToConnect(id?: string) {
  if (!id) return
  void router.push({ name: nameOf('connect'), params: { id } })
}

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="remote-task-user.connectors.page"
    :title="runtime.t('remoteTaskUser.connectors.title', 'Available Connectors')"
    description="Browse available connectors and start the authorization flow."
  >
    <template #actions>
      <button
        data-test-id="remote-task-user.connectors.retry"
        class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        @click="load"
      >
        {{ runtime.t('remoteTaskUser.common.retry', 'Retry') }}
      </button>
    </template>

    <BundleState
      v-if="loading"
      variant="loading"
      :message="runtime.t('remoteTaskUser.common.loading', 'Loading...')"
    />
    <BundleState
      v-else-if="error"
      variant="error"
      :message="error"
      :action-label="runtime.t('remoteTaskUser.common.retry', 'Retry')"
      @action="load"
    />
    <BundleState
      v-else-if="!connectors?.length"
      variant="empty"
      :message="runtime.t('remoteTaskUser.connectors.empty', 'No connectors available.')"
    />
    <div v-else class="grid gap-4 md:grid-cols-2">
      <BundlePanel
        v-for="connector in connectors"
        :key="connector.id"
        :data-test-id="`remote-task-user.connectors.card.${connector.id}`"
      >
        <div class="flex h-full flex-col gap-4">
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-slate-950">{{ connector.package?.name || connector.id }}</h2>
              <p class="text-sm leading-6 text-slate-500">{{ connector.package?.package_description || '-' }}</p>
            </div>
            <span class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">{{ connector.version || '-' }}</span>
          </div>
          <div class="mt-auto flex flex-wrap gap-2">
            <button
              :data-test-id="`remote-task-user.connectors.connect.${connector.id}`"
              class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              @click="goToConnect(connector.id)"
            >
              {{ runtime.t('remoteTaskUser.connectors.connect', 'Connect') }}
            </button>
            <button
              :data-test-id="`remote-task-user.connectors.detail.${connector.id}`"
              class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              @click="goToDetail(connector.id)"
            >
              {{ runtime.t('remoteTaskUser.connectors.detail', 'View Details') }}
            </button>
          </div>
        </div>
      </BundlePanel>
    </div>
  </BundlePage>
</template>
