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
    :title="runtime.t('remoteTaskUser.connections.title', 'My Connections')"
    description="Manage the app connections available to this team."
  >
    <template #actions>
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="load">
        {{ runtime.t('remoteTaskUser.common.retry', 'Retry') }}
      </button>
      <button data-test-id="remote-task-user.connections.connect-app" class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" @click="router.push({ name: nameOf('connectors') })">
        {{ runtime.t('remoteTaskUser.connections.connectApp', 'Connect App') }}
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
    <div v-else-if="!connections?.length" class="space-y-3">
      <BundleState
        variant="empty"
        :message="runtime.t('remoteTaskUser.connections.empty', `You haven't connected any apps yet.`)"
      />
      <button
        data-test-id="remote-task-user.connections.connect-first"
        class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        @click="router.push({ name: nameOf('connectors') })"
      >
        {{ runtime.t('remoteTaskUser.connections.connectFirst', 'Connect Your First App') }}
      </button>
    </div>
    <div v-else class="overflow-hidden rounded-2xl border border-slate-200">
      <table data-test-id="remote-task-user.connections.table" class="min-w-full bg-white">
        <thead class="bg-slate-50 text-left text-sm text-slate-500">
          <tr>
            <th class="px-4 py-3 font-medium">Connector</th>
            <th class="px-4 py-3 font-medium">Label</th>
            <th class="px-4 py-3 font-medium">Scopes</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Created</th>
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
            <td class="px-4 py-4 text-slate-600">{{ connection.label || '-' }}</td>
            <td class="px-4 py-4 text-slate-600">{{ connection.auth_scopes?.join(', ') || '-' }}</td>
            <td class="px-4 py-4 text-slate-600">{{ connection.status || '-' }}</td>
            <td class="px-4 py-4 text-slate-600">{{ connection.created_at || '-' }}</td>
            <td class="px-4 py-4">
              <div class="flex flex-wrap gap-2">
                <button
                  :data-test-id="`remote-task-user.connections.row.${connection.id}.detail`"
                  class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  @click="detail(connection.id)"
                >
                  Details
                </button>
                <button
                  :data-test-id="`remote-task-user.connections.row.${connection.id}.reauth`"
                  class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  @click="reauth(connection.id)"
                >
                  {{ runtime.t('remoteTaskUser.connections.reauth', 'Reauthorize') }}
                </button>
                <button
                  :data-test-id="`remote-task-user.connections.row.${connection.id}.disconnect`"
                  class="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                  @click="disconnect(connection.id)"
                >
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
