<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@mcplinx/ui-vue'
import BundlePage from '../components/BundlePage.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskUserRuntime } from '../facade'
import { openAuthTaskWindow, type AuthTaskWindowController } from '../authTaskWindow'

const runtime = useRemoteTaskUserRuntime()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const connections = ref<Awaited<ReturnType<typeof runtime.facade.listConnections>>['connections']>([])
const manualAuthUrl = ref('')
let authController: AuthTaskWindowController | null = null

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
  if (response.url) {
    manualAuthUrl.value = ''
    authController?.cleanup()
    authController = openAuthTaskWindow({
      authUrl: response.url,
      authTaskFacade: runtime.authTaskFacade,
      onTerminal: async () => {
        await load()
      },
    })
    if (authController.popupBlocked) {
      manualAuthUrl.value = response.url
    }
  }
}

function detail(id?: string) {
  if (!id) return
  void router.push({ name: nameOf('connection-detail'), params: { id } })
}

onMounted(load)

onUnmounted(() => {
  authController?.cleanup()
  authController = null
})
</script>

<template>
  <BundlePage
    data-test-id="remote-task-user.connections.page"
    :title="runtime.t('remoteTaskUser.connections.title', 'My Connections')"
    description="Manage the app connections available to this team."
  >
    <template #actions>
      <Button variant="outline" @click="load">
        {{ runtime.t('remoteTaskUser.common.retry', 'Retry') }}
      </Button>
      <Button data-test-id="remote-task-user.connections.connect-app" @click="router.push({ name: nameOf('connectors') })">
        {{ runtime.t('remoteTaskUser.connections.connectApp', 'Connect App') }}
      </Button>
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
    <div
      v-else-if="manualAuthUrl"
      data-test-id="remote-task-user.connections.manual-auth"
      class="rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground"
    >
      <p class="mb-2">The browser blocked the auth popup. Open the auth page manually.</p>
      <a :href="manualAuthUrl" target="_blank" rel="noreferrer" class="underline">Open Authentication Page</a>
    </div>
    <div v-else-if="!connections?.length" class="space-y-3">
      <BundleState
        variant="empty"
        :message="runtime.t('remoteTaskUser.connections.empty', `You haven't connected any apps yet.`)"
      />
      <Button
        data-test-id="remote-task-user.connections.connect-first"
        class="w-fit"
        @click="router.push({ name: nameOf('connectors') })"
      >
        {{ runtime.t('remoteTaskUser.connections.connectFirst', 'Connect Your First App') }}
      </Button>
    </div>
    <div v-else class="overflow-hidden rounded-2xl border border-border">
      <table data-test-id="remote-task-user.connections.table" class="min-w-full bg-card">
        <thead class="bg-muted/40 text-left text-sm text-muted-foreground">
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
            class="border-t border-border"
          >
            <td class="px-4 py-4 font-medium text-foreground">{{ connection.package?.name || connection.connector_id || connection.id }}</td>
            <td class="px-4 py-4 text-muted-foreground">{{ connection.label || '-' }}</td>
            <td class="px-4 py-4 text-muted-foreground">{{ connection.auth_scopes?.join(', ') || '-' }}</td>
            <td class="px-4 py-4 text-muted-foreground">{{ connection.status || '-' }}</td>
            <td class="px-4 py-4 text-muted-foreground">{{ connection.created_at || '-' }}</td>
            <td class="px-4 py-4">
              <div class="flex flex-wrap gap-2">
                <Button
                  :data-test-id="`remote-task-user.connections.row.${connection.id}.detail`"
                  variant="outline"
                  size="sm"
                  @click="detail(connection.id)"
                >
                  Details
                </Button>
                <Button
                  :data-test-id="`remote-task-user.connections.row.${connection.id}.reauth`"
                  variant="outline"
                  size="sm"
                  @click="reauth(connection.id)"
                >
                  {{ runtime.t('remoteTaskUser.connections.reauth', 'Reauthorize') }}
                </Button>
                <Button
                  :data-test-id="`remote-task-user.connections.row.${connection.id}.disconnect`"
                  variant="destructive"
                  size="sm"
                  @click="disconnect(connection.id)"
                >
                  {{ runtime.t('remoteTaskUser.connections.disconnect', 'Disconnect') }}
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </BundlePage>
</template>
