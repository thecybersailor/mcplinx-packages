<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@mcplinx/ui-vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskUserRuntime } from '../facade'
import { openAuthTaskWindow, type AuthTaskWindowController } from '../authTaskWindow'

const runtime = useRemoteTaskUserRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const manualAuthUrl = ref('')
const connection = ref<Awaited<ReturnType<typeof runtime.facade.getConnection>> | null>(null)
const connectionId = computed(() => String(route.params.id ?? ''))
let authController: AuthTaskWindowController | null = null

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

onMounted(load)

onUnmounted(() => {
  authController?.cleanup()
  authController = null
})
</script>

<template>
  <BundlePage
    data-test-id="remote-task-user.connection-detail.page"
    :title="connection?.package?.name || connection?.connector_id || runtime.t('remoteTaskUser.connectionDetail.title', 'Connection Detail')"
    :description="`Connection ID: ${connection?.id || connectionId}`"
  >
    <template #actions>
      <Button
        data-test-id="remote-task-user.connection-detail.back"
        variant="outline"
        @click="router.back()"
      >
        {{ runtime.t('remoteTaskUser.common.backToList', 'Back to list') }}
      </Button>
    </template>

    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskUser.common.loading', 'Loading...')" />
    <BundleState v-else-if="error" variant="error" :message="error" />
    <div v-else-if="connection" class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <div class="space-y-4">
        <BundlePanel>
          <h2 class="mb-3 text-base font-semibold text-foreground">Connection Information</h2>
          <dl class="grid gap-3 md:grid-cols-2">
            <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Connection ID</dt><dd class="mt-1 text-sm text-foreground">{{ connection.id || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Connector ID</dt><dd class="mt-1 text-sm text-foreground">{{ connection.connector_id || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Status</dt><dd class="mt-1 text-sm text-foreground">{{ connection.status || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Label</dt><dd class="mt-1 text-sm text-foreground">{{ connection.label || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Created At</dt><dd class="mt-1 text-sm text-foreground">{{ connection.created_at || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Last Used</dt><dd class="mt-1 text-sm text-foreground">{{ connection.updated_at || '-' }}</dd></div>
          </dl>
        </BundlePanel>

        <BundlePanel>
          <h2 class="mb-3 text-base font-semibold text-foreground">Status Details</h2>
          <div class="space-y-2 text-sm text-muted-foreground">
            <p v-if="connection.requires_reauth">This connection requires reauthorization.</p>
            <p v-else-if="connection.status === 'expired'">The access token has expired.</p>
            <p v-else-if="connection.status === 'error'">The authorization may have been revoked.</p>
            <p v-else>Connection is healthy.</p>
          </div>
        </BundlePanel>

        <BundlePanel>
          <h2 class="mb-3 text-base font-semibold text-foreground">Available Tools</h2>
          <div v-if="connection.tools?.length" class="space-y-3">
            <div v-for="(tool, index) in connection.tools" :key="String(tool.name ?? tool.id ?? index)" class="rounded-xl border border-border bg-card px-4 py-3">
              <div class="text-sm font-semibold text-foreground">{{ String(tool.name ?? tool.id ?? 'Tool') }}</div>
              <p class="mt-2 text-sm text-muted-foreground">{{ String(tool.description ?? 'No description available.') }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground">No tools available for this connector.</p>
        </BundlePanel>
      </div>

      <div class="space-y-4">
        <BundlePanel>
          <h2 class="mb-3 text-base font-semibold text-foreground">Actions</h2>
          <div
            v-if="manualAuthUrl"
            data-test-id="remote-task-user.connection-detail.manual-auth"
            class="mb-3 rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground"
          >
            <p class="mb-2">The browser blocked the auth popup. Open the auth page manually.</p>
            <a :href="manualAuthUrl" target="_blank" rel="noreferrer" class="underline">Open Authentication Page</a>
          </div>
          <div class="flex flex-col gap-2">
            <Button
              data-test-id="remote-task-user.connection-detail.reauth"
              variant="outline"
              @click="reauth"
            >
              {{ runtime.t('remoteTaskUser.connections.reauth', 'Reauthorize') }}
            </Button>
            <Button
              data-test-id="remote-task-user.connection-detail.disconnect"
              variant="destructive"
              @click="disconnect"
            >
              {{ runtime.t('remoteTaskUser.connections.disconnect', 'Disconnect') }}
            </Button>
            <Button
              data-test-id="remote-task-user.connection-detail.back-to-connections"
              variant="outline"
              @click="router.push({ name: `${runtime.routePrefix}-connections` })"
            >
              Back to Connections
            </Button>
          </div>
        </BundlePanel>
      </div>
    </div>
  </BundlePage>
</template>
