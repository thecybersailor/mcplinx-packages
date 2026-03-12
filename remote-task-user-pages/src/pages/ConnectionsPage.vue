<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskUserRuntime } from '../facade'

const runtime = useRemoteTaskUserRuntime()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const connections = ref<Awaited<ReturnType<typeof runtime.facade.listConnections>>['connections']>([])

function nameOf(suffix: string) {
  return `${runtime.routePrefix}-${suffix}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await runtime.facade.listConnections()
    connections.value = response.connections ?? []
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed')
    connections.value = []
  } finally {
    loading.value = false
  }
}

async function disconnect(id?: string) {
  if (!id) return
  await runtime.facade.deleteConnection(id)
  await load()
}

async function reauth(id?: string) {
  if (!id) return
  const response = await runtime.facade.reauthConnection(id)
  if (response.url && typeof window !== 'undefined') {
    window.location.href = response.url
  }
}

function detail(id?: string) {
  if (!id) return
  void router.push({ name: nameOf('connection-detail'), params: { id } })
}

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="remote-task-user.connections.page"
    :title="runtime.t('remoteTaskUser.connections.title', 'Connections')"
    description="Use the same connector management surface across team, tenant, and platform hosts."
  >
    <template #actions>
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="load">
        {{ runtime.t('remoteTaskUser.common.retry', 'Retry') }}
      </button>
      <button class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" @click="router.push({ name: nameOf('connectors') })">
        Browse
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
      v-else-if="!connections?.length"
      variant="empty"
      :message="runtime.t('remoteTaskUser.connections.empty', 'No connections yet.')"
    />
    <div v-else class="overflow-hidden rounded-2xl border border-slate-200">
      <table data-test-id="remote-task-user.connections.table" class="min-w-full bg-white">
        <thead class="bg-slate-50 text-left text-sm text-slate-500">
          <tr>
            <th class="px-4 py-3 font-medium">Name</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Updated</th>
            <th class="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="connection in connections"
            :key="connection.id"
            :data-test-id="`remote-task-user.connections.row.${connection.id}`"
            class="border-t border-slate-200"
          >
            <td class="px-4 py-4 font-medium text-slate-950">{{ connection.package?.name || connection.connector_id || connection.id }}</td>
            <td class="px-4 py-4 text-slate-600">{{ connection.status || '-' }}</td>
            <td class="px-4 py-4 text-slate-600">{{ connection.updated_at || '-' }}</td>
            <td class="px-4 py-4">
              <div class="flex flex-wrap gap-2">
                <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="detail(connection.id)">Details</button>
                <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="reauth(connection.id)">{{ runtime.t('remoteTaskUser.connections.reauth', 'Reauthorize') }}</button>
                <button class="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100" @click="disconnect(connection.id)">
                  {{ runtime.t('remoteTaskUser.connections.disconnect', 'Disconnect') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </BundlePage>
</template>
