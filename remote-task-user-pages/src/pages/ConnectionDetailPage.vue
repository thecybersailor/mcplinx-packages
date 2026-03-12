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
    :title="runtime.t('remoteTaskUser.connectionDetail.title', 'Connection detail')"
    :description="connection?.package?.name || connection?.connector_id || connection?.id || ''"
  >
    <template #actions>
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="router.back()">
        {{ runtime.t('remoteTaskUser.common.backToList', 'Back to list') }}
      </button>
    </template>

    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskUser.common.loading', 'Loading...')" />
    <BundleState v-else-if="error" variant="error" :message="error" />
    <div v-else-if="connection" class="space-y-4">
      <BundlePanel>
        <dl class="grid gap-3 md:grid-cols-2">
          <div><dt class="text-xs uppercase tracking-wide text-slate-400">ID</dt><dd class="mt-1 text-sm text-slate-800">{{ connection.id || '-' }}</dd></div>
          <div><dt class="text-xs uppercase tracking-wide text-slate-400">Status</dt><dd class="mt-1 text-sm text-slate-800">{{ connection.status || '-' }}</dd></div>
          <div><dt class="text-xs uppercase tracking-wide text-slate-400">Label</dt><dd class="mt-1 text-sm text-slate-800">{{ connection.label || '-' }}</dd></div>
          <div><dt class="text-xs uppercase tracking-wide text-slate-400">Updated</dt><dd class="mt-1 text-sm text-slate-800">{{ connection.updated_at || '-' }}</dd></div>
        </dl>
      </BundlePanel>
      <BundlePanel>
        <pre class="overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{{ JSON.stringify(connection, null, 2) }}</pre>
      </BundlePanel>
      <div class="flex flex-wrap gap-2">
        <button
          data-test-id="remote-task-user.connection-detail.tasks"
          class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          @click="router.push({ name: `${runtime.routePrefix}-tasks` })"
        >
          {{ runtime.t('remoteTaskUser.tasks.title', 'Tasks') }}
        </button>
        <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="reauth">{{ runtime.t('remoteTaskUser.connections.reauth', 'Reauthorize') }}</button>
        <button class="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100" @click="disconnect">
          {{ runtime.t('remoteTaskUser.connections.disconnect', 'Disconnect') }}
        </button>
      </div>
    </div>
  </BundlePage>
</template>
