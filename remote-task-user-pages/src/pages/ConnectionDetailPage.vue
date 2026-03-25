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
const connection = ref<Awaited<ReturnType<typeof runtime.facade.getConnection>> | null>(null)
const connectionId = computed(() => String(route.params.id ?? ''))

async function load() {
  if (!connectionId.value) return
  loading.value = true
  error.value = ''
  try {
    connection.value = await runtime.facade.getConnection(connectionId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed')
    connection.value = null
  } finally {
    loading.value = false
  }
}

async function disconnect() {
  if (!connectionId.value) return
  await runtime.facade.deleteConnection(connectionId.value)
  await router.push({ name: `${runtime.routePrefix}-connections` })
}

async function reauth() {
  if (!connectionId.value) return
  const response = await runtime.facade.reauthConnection(connectionId.value)
  if (response.url && typeof window !== 'undefined') {
    window.location.href = response.url
  }
}

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="remote-task-user.connection-detail.page"
    :title="connection?.package?.name || connection?.connector_id || runtime.t('remoteTaskUser.connectionDetail.title', 'Connection Detail')"
    :description="`Connection ID: ${connection?.id || connectionId}`"
  >
    <template #actions>
      <button
        data-test-id="remote-task-user.connection-detail.back"
        class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        @click="router.back()"
      >
        {{ runtime.t('remoteTaskUser.common.backToList', 'Back to list') }}
      </button>
    </template>

    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskUser.common.loading', 'Loading...')" />
    <BundleState v-else-if="error" variant="error" :message="error" />
    <div v-else-if="connection" class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <div class="space-y-4">
        <BundlePanel>
          <h2 class="mb-3 text-base font-semibold text-slate-950">Connection Information</h2>
          <dl class="grid gap-3 md:grid-cols-2">
            <div><dt class="text-xs uppercase tracking-wide text-slate-400">Connection ID</dt><dd class="mt-1 text-sm text-slate-800">{{ connection.id || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-slate-400">Connector ID</dt><dd class="mt-1 text-sm text-slate-800">{{ connection.connector_id || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-slate-400">Status</dt><dd class="mt-1 text-sm text-slate-800">{{ connection.status || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-slate-400">Label</dt><dd class="mt-1 text-sm text-slate-800">{{ connection.label || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-slate-400">Created At</dt><dd class="mt-1 text-sm text-slate-800">{{ connection.created_at || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-slate-400">Last Used</dt><dd class="mt-1 text-sm text-slate-800">{{ connection.updated_at || '-' }}</dd></div>
          </dl>
        </BundlePanel>

        <BundlePanel>
          <h2 class="mb-3 text-base font-semibold text-slate-950">Status Details</h2>
          <div class="space-y-2 text-sm text-slate-600">
            <p v-if="connection.requires_reauth">This connection requires reauthorization.</p>
            <p v-else-if="connection.status === 'expired'">The access token has expired.</p>
            <p v-else-if="connection.status === 'error'">The authorization may have been revoked.</p>
            <p v-else>Connection is healthy.</p>
          </div>
        </BundlePanel>

        <BundlePanel>
          <h2 class="mb-3 text-base font-semibold text-slate-950">Available Tools</h2>
          <div v-if="connection.tools?.length" class="space-y-3">
            <div v-for="(tool, index) in connection.tools" :key="String(tool.name ?? tool.id ?? index)" class="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div class="text-sm font-semibold text-slate-950">{{ String(tool.name ?? tool.id ?? 'Tool') }}</div>
              <p class="mt-2 text-sm text-slate-600">{{ String(tool.description ?? 'No description available.') }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-slate-500">No tools available for this connector.</p>
        </BundlePanel>
      </div>

      <div class="space-y-4">
        <BundlePanel>
          <h2 class="mb-3 text-base font-semibold text-slate-950">Actions</h2>
          <div class="flex flex-col gap-2">
            <button
              data-test-id="remote-task-user.connection-detail.reauth"
              class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              @click="reauth"
            >
              {{ runtime.t('remoteTaskUser.connections.reauth', 'Reauthorize') }}
            </button>
            <button
              data-test-id="remote-task-user.connection-detail.disconnect"
              class="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
              @click="disconnect"
            >
              {{ runtime.t('remoteTaskUser.connections.disconnect', 'Disconnect') }}
            </button>
            <button
              data-test-id="remote-task-user.connection-detail.back-to-connections"
              class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              @click="router.push({ name: `${runtime.routePrefix}-connections` })"
            >
              Back to Connections
            </button>
          </div>
        </BundlePanel>
      </div>
    </div>
  </BundlePage>
</template>
