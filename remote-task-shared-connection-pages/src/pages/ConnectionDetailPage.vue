<template>
  <div class="container mx-auto py-8 p-6 space-y-6">
    <div class="mb-6 flex items-center gap-4">
      <Button variant="ghost" @click="$router.back()">
        <span class="mr-2">←</span>
        Back
      </Button>
      <ConnectorIcon
        v-if="connection?.package?.icon_url"
        :iconURL="connection.package.icon_url"
        size="md"
      />
      <div>
        <h1 class="text-3xl font-bold">{{ connection?.package?.name || connection?.connector_id || 'Connection Details' }}</h1>
        <p class="text-sm text-muted-foreground">
          Connection ID: <code class="bg-muted px-1 rounded">{{ connectionId }}</code>
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <span class="text-muted-foreground">Loading...</span>
    </div>

    <div v-else-if="error" class="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-destructive">
      <span>{{ error }}</span>
      <div class="mt-4">
        <Button variant="outline" @click="$router.push({ name: `${runtime.routePrefix}-connections` })">
          Back to Connections
        </Button>
      </div>
    </div>

    <template v-else-if="connection">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Connection Information</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <Label class="text-muted-foreground">Connection ID</Label>
                  <p class="font-mono text-sm font-medium">{{ connection.id || '-' }}</p>
                </div>
                <div>
                  <Label class="text-muted-foreground">Connector ID</Label>
                  <p class="font-medium">{{ connection.connector_id || '-' }}</p>
                </div>
                <div>
                  <Label class="text-muted-foreground">Status</Label>
                  <div class="mt-1">
                    <Badge :variant="getStatusVariant(connection)">
                      {{ getStatusText(connection) }}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label class="text-muted-foreground">Label</Label>
                  <p class="font-medium">{{ connection.label || '-' }}</p>
                </div>
                <div>
                  <Label class="text-muted-foreground">Created At</Label>
                  <p class="font-medium">{{ formatDate(connection.created_at) }}</p>
                </div>
                <div>
                  <Label class="text-muted-foreground">Last Used</Label>
                  <p class="font-medium">{{ formatDate(connection.updated_at) }}</p>
                </div>
              </div>

              <div v-if="connection.token_expires_at">
                <Label class="text-muted-foreground">Token Expires At</Label>
                <p class="font-medium">{{ formatDate(connection.token_expires_at) }}</p>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ getExpiryText(connection.token_expires_at) }}
                </p>
              </div>

              <div v-if="connection.auth_scopes && connection.auth_scopes.length > 0">
                <Label class="text-muted-foreground">Authorized Scopes</Label>
                <div class="mt-2 flex flex-wrap gap-2">
                  <Badge v-for="scope in connection.auth_scopes" :key="scope" variant="outline">
                    {{ scope }}
                  </Badge>
                </div>
              </div>

              <div v-if="connection.required_scopes && connection.required_scopes.length > 0">
                <Label class="text-muted-foreground">Required Scopes</Label>
                <div class="mt-2 flex flex-wrap gap-2">
                  <Badge v-for="scope in connection.required_scopes" :key="scope" variant="secondary">
                    {{ scope }}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card v-if="connection.requires_reauth || connection.status !== 'active' || connection.resolution_hint">
            <CardHeader>
              <CardTitle>Status Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="connection.requires_reauth" class="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  This connection requires reauthorization. The permissions may have been updated.
                </p>
              </div>
              <div v-if="connection.status === 'expired'" class="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <p class="text-sm font-medium text-red-800 dark:text-red-200">
                  The access token has expired. Please reauthorize to continue using this connection.
                </p>
              </div>
              <div v-if="connection.status === 'error'" class="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <p class="text-sm font-medium text-red-800 dark:text-red-200">
                  This connection has an error. The authorization may have been revoked.
                </p>
              </div>
              <div v-if="connection.resolution_hint" class="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {{ connection.resolution_hint }}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Tools ({{ tools.length }})</CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="toolsLoading" class="flex justify-center py-4">
                <span class="text-muted-foreground">Loading tools...</span>
              </div>
              <div v-else-if="toolsError" class="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-destructive">
                <span>{{ toolsError }}</span>
              </div>
              <div v-else-if="tools.length === 0" class="py-4 text-center text-muted-foreground">
                No tools available for this connector.
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="tool in tools"
                  :key="String(tool.id ?? tool.name ?? tool.description ?? 'tool')"
                  class="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <h4 class="text-base font-semibold">{{ String(tool.name ?? tool.id ?? 'Tool') }}</h4>
                      <Badge variant="outline" class="text-xs">{{ String(tool.kind ?? 'tool') }}</Badge>
                    </div>
                    <div v-if="tool.description" class="text-sm leading-relaxed text-foreground">
                      <p class="whitespace-pre-wrap">{{ String(tool.description) }}</p>
                    </div>
                    <div v-else class="text-sm italic text-muted-foreground">
                      No description available
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <Button
                v-if="shouldShowReauth(connection)"
                variant="secondary"
                class="w-full"
                :disabled="reauthLoading"
                data-test-id="shared-connections.detail.reauth"
                @click="handleReauth"
              >
                {{ reauthLoading ? 'Processing...' : 'Reauthorize' }}
              </Button>
              <Button
                variant="destructive"
                class="w-full"
                :disabled="disconnectLoading"
                data-test-id="shared-connections.detail.delete"
                @click="handleDisconnect"
              >
                {{ disconnectLoading ? 'Processing...' : 'Disconnect' }}
              </Button>
              <Button
                variant="outline"
                class="w-full"
                @click="$router.push({ name: `${runtime.routePrefix}-connections` })"
              >
                Back to Connections
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Label } from '@mcplinx/ui-vue'
import { useRemoteTaskSharedConnectionRuntime, type SharedConnectionRecord } from '../facade'
import ConnectorIcon from '../components/ConnectorIcon.vue'

const runtime = useRemoteTaskSharedConnectionRuntime()
const route = useRoute()
const router = useRouter()

const connectionId = computed(() => String(route.params.id ?? ''))
const connection = ref<SharedConnectionRecord | null>(null)
const loading = ref(true)
const error = ref('')
const reauthLoading = ref(false)
const disconnectLoading = ref(false)
const tools = ref<Array<Record<string, unknown>>>([])
const toolsLoading = ref(false)
const toolsError = ref('')

onMounted(async () => {
  await loadConnection()
})

async function loadConnection() {
  try {
    loading.value = true
    error.value = ''
    const found = await runtime.facade.getConnection(connectionId.value)
    connection.value = found
    const rawTools = (found as Record<string, unknown>).available_tools
    tools.value = Array.isArray(rawTools)
      ? rawTools.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
      : []
  } catch (e: unknown) {
    console.error('Error loading connection:', e)
    error.value = e instanceof Error ? e.message || 'Failed to load connection' : 'Failed to load connection'
  } finally {
    loading.value = false
  }
}

function getStatusVariant(conn: SharedConnectionRecord): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (conn.status === 'expired' || conn.status === 'error') return 'destructive'
  if (conn.requires_reauth) return 'secondary'
  if (conn.status === 'pending') return 'secondary'
  if (conn.token_expires_at) {
    const expiresAt = new Date(conn.token_expires_at)
    const daysUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    if (daysUntilExpiry < 7) return 'secondary'
  }
  return 'default'
}

function getStatusText(conn: SharedConnectionRecord) {
  if (conn.status === 'pending') return 'Pending'
  if (conn.status === 'expired') return 'Token Expired'
  if (conn.status === 'error') return 'Authorization Revoked'
  if (conn.requires_reauth) return 'Permissions Updated'
  if (conn.token_expires_at) {
    const expiresAt = new Date(conn.token_expires_at)
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntilExpiry < 7) return `Expires in ${daysUntilExpiry} days`
  }
  return 'Connected'
}

function getExpiryText(expiresAt: string) {
  const expires = new Date(expiresAt)
  const daysUntilExpiry = Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysUntilExpiry < 0) return 'Already expired'
  if (daysUntilExpiry === 0) return 'Expires today'
  if (daysUntilExpiry === 1) return 'Expires tomorrow'
  return `Expires in ${daysUntilExpiry} days`
}

function shouldShowReauth(conn: SharedConnectionRecord) {
  return conn.status === 'expired' || conn.status === 'error' || conn.requires_reauth
}

async function handleReauth() {
  if (!connection.value?.id) return
  try {
    reauthLoading.value = true
    error.value = ''
    const data = await runtime.facade.reauthConnection(connection.value.id, {
      connector_id: connection.value.connector_id,
      label: connection.value.label,
      scope: connection.value.scope || runtime.scope,
      principal_pattern: connection.value.principal_pattern,
      inherits_to: connection.value.inherits_to,
    })
    if (data.url) {
      window.location.href = data.url
    }
  } catch (e: unknown) {
    console.error('Error reauthorizing:', e)
    error.value = e instanceof Error ? e.message || 'Failed to reauthorize' : 'Failed to reauthorize'
  } finally {
    reauthLoading.value = false
  }
}

async function handleDisconnect() {
  if (!connection.value?.id) return
  if (!confirm('Are you sure you want to disconnect this connection?')) return
  try {
    disconnectLoading.value = true
    error.value = ''
    await runtime.facade.deleteConnection(connection.value.id)
    await router.push({ name: `${runtime.routePrefix}-connections` })
  } catch (e: unknown) {
    console.error('Error disconnecting:', e)
    error.value = e instanceof Error ? e.message || 'Failed to disconnect' : 'Failed to disconnect'
  } finally {
    disconnectLoading.value = false
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}
</script>
