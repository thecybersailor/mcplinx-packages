<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRemoteTaskSharedConnectionRuntime, type SharedConnectionRecord } from '../facade'
import { openAuthTaskWindow, type AuthTaskWindowController } from '../authTaskWindow'

const runtime = useRemoteTaskSharedConnectionRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const connections = ref<SharedConnectionRecord[]>([])
const pendingId = ref('')
const manualAuthUrl = ref('')
let authController: AuthTaskWindowController | null = null

const connectorId = computed(() => {
  const value = route.query.connector_id
  return typeof value === 'string' ? value : ''
})

onMounted(async () => {
  await loadConnections()
})

function connectAppTarget() {
  if (runtime.connectAppTarget) {
    return runtime.connectAppTarget(connectorId.value || undefined)
  }
  return {
    name: `${runtime.routePrefix}-create`,
    query: connectorId.value ? { connector_id: connectorId.value } : undefined,
  }
}

async function loadConnections() {
  try {
    loading.value = true
    error.value = ''
    const response = await runtime.facade.listConnections({
      scope: runtime.scope,
      connector_id: connectorId.value || undefined,
    })
    connections.value = response.items ?? []
  } catch (err) {
    console.error('Error loading connections:', err)
    error.value = runtime.t('sharedConnections.loadError', 'Failed to load connections')
  } finally {
    loading.value = false
  }
}

function statusTone(item: SharedConnectionRecord): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (item.status === 'expired' || item.status === 'error') return 'destructive'
  if (item.requires_reauth) return 'secondary'
  if (item.status === 'pending') return 'outline'
  if (item.token_expires_at) {
    const expiresAt = new Date(item.token_expires_at)
    const daysUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    if (daysUntilExpiry < 7) return 'secondary'
  }
  return 'default'
}

function statusClass(item: SharedConnectionRecord) {
  const tone = statusTone(item)
  if (tone === 'destructive') return 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-100'
  if (tone === 'secondary') return 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-100'
  if (tone === 'outline') return 'border-border bg-muted text-muted-foreground'
  return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100'
}

function statusText(item: SharedConnectionRecord) {
  if (item.status === 'expired') return runtime.t('sharedConnections.status.tokenExpired', 'Token Expired')
  if (item.status === 'error') return runtime.t('sharedConnections.status.authorizationRevoked', 'Authorization Revoked')
  if (item.requires_reauth) return runtime.t('sharedConnections.status.permissionsUpdated', 'Permissions Updated')
  if (item.status === 'pending') return runtime.t('sharedConnections.status.pending', 'Pending')
  if (item.token_expires_at) {
    const expiresAt = new Date(item.token_expires_at)
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntilExpiry < 7) return runtime.t('sharedConnections.status.expiresInDays', 'Expires in {days} days', { days: daysUntilExpiry })
  }
  return runtime.t('sharedConnections.status.connected', 'Connected')
}

function shouldShowReauth(item: SharedConnectionRecord) {
  return item.status === 'expired' || item.status === 'error' || item.requires_reauth
}

async function reauth(item: SharedConnectionRecord) {
  if (!item.id) return
  try {
    pendingId.value = item.id
    error.value = ''
    manualAuthUrl.value = ''
    const response = await runtime.facade.createAuthTask({
      connection_id: item.id,
      connector_id: item.connector_id,
      label: item.label,
      scope: item.scope || runtime.scope,
      principal_pattern: item.principal_pattern,
      inherits_to: item.inherits_to,
      intent: 'reauth',
    })
    if (response.auth_url) {
      authController?.cleanup()
      authController = openAuthTaskWindow({
        authUrl: response.auth_url,
        taskId: response.task_id,
        authTaskFacade: runtime.authTaskFacade,
        onTerminal: async () => {
          pendingId.value = ''
          await loadConnections()
        },
      })
      if (authController.popupBlocked) {
        manualAuthUrl.value = response.auth_url
      }
    }
  } catch (err) {
    console.error('Error reauthorizing connection:', err)
    error.value = runtime.t('sharedConnections.reauthError', 'Failed to reauthorize connection')
  } finally {
    pendingId.value = ''
  }
}

onUnmounted(() => {
  authController?.cleanup()
  authController = null
})

async function disconnect(item: SharedConnectionRecord) {
  if (!item.id) return
  if (typeof window !== 'undefined' && !window.confirm(runtime.t('sharedConnections.disconnectConfirm', 'Are you sure you want to disconnect this connection?'))) {
    return
  }
  try {
    pendingId.value = item.id
    error.value = ''
    await runtime.facade.deleteConnection(item.id)
    await loadConnections()
  } catch (err) {
    console.error('Error disconnecting connection:', err)
    error.value = runtime.t('sharedConnections.disconnectError', 'Failed to disconnect connection')
  } finally {
    pendingId.value = ''
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}
</script>

<template>
  <div data-test-id="shared-connections.page" class="space-y-6 p-6 py-8 text-foreground">
    <div class="flex items-center justify-between gap-4">
      <div class="space-y-2">
        <h1 class="text-3xl font-bold text-foreground">{{ runtime.t('sharedConnections.title', 'Connections') }}</h1>
        <p class="text-sm text-muted-foreground">{{ runtime.t('sharedConnections.scope', 'Scope: {scope}', { scope: runtime.scope }) }}</p>
        <p v-if="connectorId" class="text-sm text-muted-foreground">
          {{ runtime.t('sharedConnections.filteredByConnector', 'Filtered by connector: {connectorId}', { connectorId }) }}
        </p>
      </div>
      <button
        class="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
        data-test-id="shared-connections.create-link"
        @click="router.push(connectAppTarget())"
      >
        {{ runtime.t('sharedConnections.connectApp', 'Connect App') }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <span class="text-muted-foreground">{{ runtime.t('sharedConnections.loading', 'Loading shared connections...') }}</span>
    </div>

    <div
      v-else-if="error"
      class="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-destructive"
      data-test-id="shared-connections.error"
    >
      <span>{{ error }}</span>
    </div>

    <div
      v-if="manualAuthUrl"
      data-test-id="shared-connections.manual-auth"
      class="rounded-md border border-border bg-muted/30 p-4 text-sm text-foreground"
    >
      <p class="mb-2">{{ runtime.t('sharedConnections.popupBlocked', 'The browser blocked the auth popup. Open the auth page manually.') }}</p>
      <a :href="manualAuthUrl" target="_blank" rel="noreferrer" class="underline">
        {{ runtime.t('sharedConnections.openAuthPage', 'Open Authentication Page') }}
      </a>
    </div>

    <div
      v-else-if="connections.length === 0"
      data-test-id="shared-connections.empty"
      class="rounded-lg border-2 border-dashed border-border bg-muted/30 py-12 text-center"
    >
      <p class="mb-4 text-muted-foreground">{{ runtime.t('sharedConnections.empty', "You haven't connected any apps yet.") }}</p>
      <button
        class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        @click="router.push(connectAppTarget())"
      >
        {{ runtime.t('sharedConnections.connectFirst', 'Connect Your First App') }}
      </button>
    </div>

    <div v-else class="overflow-hidden rounded-md border border-border bg-card">
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-border bg-muted/40 text-left">
            <th class="px-4 py-3 text-sm font-medium text-muted-foreground">Connector</th>
            <th class="px-4 py-3 text-sm font-medium text-muted-foreground">{{ runtime.t('sharedConnections.table.label', 'Label') }}</th>
            <th class="px-4 py-3 text-sm font-medium text-muted-foreground">{{ runtime.t('sharedConnections.table.scopes', 'Scopes') }}</th>
            <th class="px-4 py-3 text-sm font-medium text-muted-foreground">{{ runtime.t('sharedConnections.table.status', 'Status') }}</th>
            <th class="px-4 py-3 text-sm font-medium text-muted-foreground">{{ runtime.t('sharedConnections.table.created', 'Created') }}</th>
            <th class="px-4 py-3 text-sm font-medium text-muted-foreground">{{ runtime.t('sharedConnections.table.actions', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="connection in connections"
            :key="connection.id"
            :data-test-id="`shared-connections.row.${connection.id}`"
            class="border-b border-border last:border-b-0"
          >
            <td class="px-4 py-4">
              <div class="flex items-center gap-2">
                <img
                  v-if="connection.package?.icon_url"
                  :src="connection.package.icon_url"
                  :alt="connection.package?.name || connection.connector_id || 'connector icon'"
                  class="h-6 w-6 rounded"
                >
                <span class="text-foreground">{{ connection.package?.name || connection.connector_id || '-' }}</span>
              </div>
            </td>
            <td class="px-4 py-4 text-muted-foreground">{{ connection.label || '-' }}</td>
            <td class="px-4 py-4">
              <div v-if="connection.auth_scopes && connection.auth_scopes.length > 0" class="flex flex-wrap gap-1">
                <span
                  v-for="scope in connection.auth_scopes"
                  :key="scope"
                  class="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {{ scope }}
                </span>
              </div>
              <span v-else class="text-sm text-muted-foreground">-</span>
            </td>
            <td class="px-4 py-4">
              <span class="rounded-full border px-3 py-1 text-xs font-medium" :class="statusClass(connection)">
                {{ statusText(connection) }}
              </span>
            </td>
            <td class="px-4 py-4 text-muted-foreground">{{ formatDate(connection.created_at) }}</td>
            <td class="px-4 py-4">
              <div class="flex flex-wrap gap-2">
                <button
                  v-if="shouldShowReauth(connection)"
                  class="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
                  :disabled="pendingId === connection.id"
                  @click="reauth(connection)"
                >
                  {{ runtime.t('sharedConnections.reauth', 'Reauthorize') }}
                </button>
                <button
                  class="inline-flex items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/20 disabled:opacity-60"
                  :disabled="pendingId === connection.id"
                  @click="disconnect(connection)"
                >
                  {{ runtime.t('sharedConnections.disconnect', 'Disconnect') }}
                </button>
                <button
                  class="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  @click="router.push({ name: `${runtime.routePrefix}-detail`, params: { id: connection.id } })"
                >
                  {{ runtime.t('sharedConnections.details', 'Details') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
