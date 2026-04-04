<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@mcplinx/ui-vue'
import ConnectionActionRunner from '../components/ConnectionActionRunner.vue'
import type { RemoteTaskConnectionActionDetail } from '../facade'
import { useRemoteTaskUserRuntime } from '../facade'
import { openAuthTaskWindow, type AuthTaskWindowController } from '../authTaskWindow'

const runtime = useRemoteTaskUserRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const manualAuthUrl = ref('')
const connection = ref<Awaited<ReturnType<typeof runtime.facade.getConnection>> | null>(null)
const actionRunnerOpen = ref(false)
const actionLoading = ref(false)
const actionSubmitting = ref(false)
const actionError = ref('')
const actionResult = ref<Record<string, unknown> | null>(null)
const selectedAction = ref<Record<string, unknown> | null>(null)
const actionDetail = ref<RemoteTaskConnectionActionDetail | null>(null)
const connectionId = computed(() => String(route.params.id ?? ''))
const availableActions = computed(() => {
  const raw = connection.value?.available_actions ?? connection.value?.tools ?? []
  return Array.isArray(raw)
    ? raw.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    : []
})
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

function actionKeyOf(action: Record<string, unknown>): string {
  return String(action.key ?? action.action_key ?? action.id ?? '')
}

function actionNameOf(action: Record<string, unknown>): string {
  return String(action.name ?? action.title ?? action.key ?? action.action_key ?? 'Tool')
}

async function openActionRunner(action: Record<string, unknown>) {
  const actionKey = actionKeyOf(action)
  if (!connectionId.value || !actionKey) return
  selectedAction.value = action
  actionRunnerOpen.value = true
  actionLoading.value = true
  actionError.value = ''
  actionResult.value = null
  actionDetail.value = null
  try {
    actionDetail.value = await runtime.facade.getConnectionAction(connectionId.value, actionKey)
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed')
  } finally {
    actionLoading.value = false
  }
}

async function executeAction(body: Record<string, unknown>) {
  const action = selectedAction.value
  const actionKey = action ? actionKeyOf(action) : ''
  if (!connectionId.value || !actionKey) return
  actionSubmitting.value = true
  actionError.value = ''
  actionResult.value = null
  try {
    const result = await runtime.facade.executeConnectionAction(connectionId.value, actionKey, body)
    const selectedActionKind = action ? String(action.kind ?? '') : ''
    const resultKind = String(result.kind ?? actionDetail.value?.kind ?? selectedActionKind)
    const isSyncResult =
      resultKind === 'sync' ||
      Object.prototype.hasOwnProperty.call(result, 'result') ||
      Object.prototype.hasOwnProperty.call(result, 'success') ||
      Object.prototype.hasOwnProperty.call(result, 'executed_at')
    if (isSyncResult) {
      actionResult.value = result.result && typeof result.result === 'object'
        ? result.result
        : result as Record<string, unknown>
      return
    }
    const executionId = String(result.execution_id ?? '')
    if (executionId) {
      actionRunnerOpen.value = false
      await router.push({
        name: `${runtime.routePrefix}-task-detail`,
        params: { ...route.params, id: executionId },
      })
      return
    }
    actionError.value = 'Missing execution id'
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed')
  } finally {
    actionSubmitting.value = false
  }
}

onMounted(load)

onUnmounted(() => {
  authController?.cleanup()
  authController = null
})
</script>

<template>
  <section
    data-test-id="remote-task-user.connection-detail.page"
    class="space-y-6 rounded-[28px] border border-border bg-card p-6 text-card-foreground shadow-sm md:p-8"
  >
    <header class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-2">
        <h1 class="text-3xl font-semibold tracking-tight text-foreground">
          {{ connection?.package?.name || connection?.connector_id || runtime.t('remoteTaskUser.connectionDetail.title', 'Connection Detail') }}
        </h1>
        <p class="max-w-3xl text-sm leading-6 text-muted-foreground">
          {{ `Connection ID: ${connection?.id || connectionId}` }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
      <Button
        data-test-id="remote-task-user.connection-detail.back"
        variant="outline"
        @click="router.back()"
      >
        {{ runtime.t('remoteTaskUser.common.backToList', 'Back to list') }}
      </Button>
      </div>
    </header>

    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-8 w-[250px]" />
      <Skeleton class="h-[125px] w-full rounded-xl" />
      <div class="space-y-2">
        <Skeleton class="h-4 w-[250px]" />
        <Skeleton class="h-4 w-[200px]" />
      </div>
    </div>
    <div
      v-else-if="error"
      class="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-6 text-sm text-destructive"
    >
      {{ error }}
    </div>
    <div v-else-if="connection" class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <div class="space-y-4">
        <Card class="bg-muted/30 shadow-none">
          <CardHeader>
            <CardTitle class="text-base">Connection Information</CardTitle>
          </CardHeader>
          <CardContent class="pt-0">
          <dl class="grid gap-3 md:grid-cols-2">
            <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Connection ID</dt><dd class="mt-1 text-sm text-foreground">{{ connection.id || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Connector ID</dt><dd class="mt-1 text-sm text-foreground">{{ connection.connector_id || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Status</dt><dd class="mt-1 text-sm text-foreground">{{ connection.status || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Label</dt><dd class="mt-1 text-sm text-foreground">{{ connection.label || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Created At</dt><dd class="mt-1 text-sm text-foreground">{{ connection.created_at || '-' }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wide text-muted-foreground">Last Used</dt><dd class="mt-1 text-sm text-foreground">{{ connection.updated_at || '-' }}</dd></div>
          </dl>
          </CardContent>
        </Card>

        <Card class="bg-muted/30 shadow-none">
          <CardHeader>
            <CardTitle class="text-base">Available Tools</CardTitle>
          </CardHeader>
          <CardContent class="pt-0">
          <div v-if="availableActions.length" class="space-y-3">
            <Button
              v-for="(tool, index) in availableActions"
              :key="String(tool.key ?? tool.action_key ?? tool.name ?? tool.id ?? index)"
              type="button"
              variant="outline"
              class="h-auto w-full justify-start rounded-xl bg-card px-4 py-3 text-left transition-colors hover:bg-muted/40"
              :data-test-id="`remote-task-user.connection-detail.action.${String(tool.key ?? tool.action_key ?? tool.id ?? index)}`"
              @click="openActionRunner(tool)"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="text-sm font-semibold text-foreground">{{ actionNameOf(tool) }}</div>
                <Badge variant="outline">
                  {{ String(tool.kind ?? 'tool') }}
                </Badge>
              </div>
              <p class="mt-2 text-sm text-muted-foreground">{{ String(tool.description ?? 'No description available.') }}</p>
            </Button>
          </div>
          <p v-else class="text-sm text-muted-foreground">No tools available for this connector.</p>
          </CardContent>
        </Card>
      </div>

      <div class="space-y-4">
        <Card class="bg-muted/30 shadow-none">
          <CardHeader>
            <CardTitle class="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent class="pt-0">
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
          </CardContent>
        </Card>
      </div>
    </div>

    <ConnectionActionRunner
      :open="actionRunnerOpen"
      :loading="actionLoading"
      :submitting="actionSubmitting"
      :detail="actionDetail || selectedAction"
      :error="actionError"
      :result="actionResult"
      data-test-id-prefix="remote-task-user.connection-detail.runner"
      @update:open="actionRunnerOpen = $event"
      @submit="executeAction"
    />
  </section>
</template>
