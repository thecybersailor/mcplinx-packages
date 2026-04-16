<script setup lang="ts">
import { onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import { useRemoteTaskSharedConnectionRuntime } from '../facade'
import { openAuthTaskWindow, type AuthTaskWindowController } from '../authTaskWindow'

const runtime = useRemoteTaskSharedConnectionRuntime()
const route = useRoute()
const router = useRouter()
const saving = ref(false)
const error = ref('')
const manualAuthUrl = ref('')
const waitingForAuth = ref(false)
let authController: AuthTaskWindowController | null = null
const form = reactive({
  connector_id: typeof route.query.connector_id === 'string' ? route.query.connector_id : '',
  label: '',
  principal_pattern: '',
  inherits_to: '',
})

function currentRequest() {
  return {
    connector_id: form.connector_id,
    label: form.label,
    scope: runtime.scope,
    principal_pattern: form.principal_pattern,
    inherits_to: form.inherits_to.split(',').map((item) => item.trim()).filter(Boolean),
  }
}

async function submit() {
  saving.value = true
  error.value = ''
  manualAuthUrl.value = ''
  try {
    const created = await runtime.facade.createAuthTask(currentRequest())
    const taskId = String(created.task_id ?? '').trim()
    if (created.auth_url && typeof window !== 'undefined') {
      if (taskId) {
        try {
          const detail = await runtime.authTaskFacade.getTask(taskId)
          const authType = String(detail.auth_type ?? '').trim().toLowerCase()
          if (authType === 'api_key' || authType === 'session' || authType === 'basic') {
            window.location.assign(created.auth_url)
            return
          }
        } catch (err) {
          console.warn('failed to preload auth task detail', err)
        }
      }
      waitingForAuth.value = true
      authController?.cleanup()
      authController = openAuthTaskWindow({
        authUrl: created.auth_url,
        taskId,
        authTaskFacade: runtime.authTaskFacade,
        onTerminal: async () => {
          waitingForAuth.value = false
          await router.push({ name: `${runtime.routePrefix}-connections` })
        },
      })
      if (authController.popupBlocked) {
        manualAuthUrl.value = created.auth_url
      }
      return
    }
    error.value = runtime.t('sharedConnections.authTaskMissing', 'Failed to start the connection auth task.')
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('sharedConnections.authTaskMissing', 'Failed to start the connection auth task.')
  } finally {
    saving.value = false
  }
}

onUnmounted(() => {
  authController?.cleanup()
  authController = null
})
</script>

<template>
  <BundlePage
    data-test-id="shared-connections.create.page"
    :title="runtime.t('sharedConnections.create', 'Create Connection')"
    :description="runtime.t('sharedConnections.createDescription', 'Create the auth task, then finish authorization in the dedicated auth URL.')"
  >
    <BundlePanel>
      <div class="mb-5 rounded-2xl border border-border bg-muted/30 p-4">
        <h2 class="text-base font-semibold text-foreground">{{ runtime.t('sharedConnections.nextStepsTitle', 'What happens next') }}</h2>
        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>{{ runtime.t('sharedConnections.nextStepsCreateTask', 'A connection auth task will be created for this connector.') }}</li>
          <li>{{ runtime.t('sharedConnections.nextStepsUseDedicatedUrl', 'The browser will open the dedicated auth URL for OAuth, API key, session, or basic auth.') }}</li>
          <li>{{ runtime.t('sharedConnections.nextStepsStayOnSuccess', 'After success, the auth page stays on its own completion screen.') }}</li>
        </ul>
      </div>
      <div
        v-if="waitingForAuth"
        data-test-id="shared-connections.create.pending-auth"
        class="mb-5 rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground"
      >
        {{ runtime.t('sharedConnections.waitingAuth', 'Waiting for authentication to complete...') }}
      </div>
      <div
        v-if="manualAuthUrl"
        data-test-id="shared-connections.create.manual-auth"
        class="mb-5 rounded-2xl border border-border bg-muted/30 p-4 text-sm text-foreground"
      >
        <p>{{ runtime.t('sharedConnections.popupBlocked', 'The browser blocked the auth popup. Open the auth page manually.') }}</p>
        <a class="mt-2 inline-flex text-sm underline" :href="manualAuthUrl" target="_blank" rel="noreferrer">
          {{ runtime.t('sharedConnections.openAuthPage', 'Open Authentication Page') }}
        </a>
      </div>
      <form class="space-y-3" @submit.prevent="submit">
        <label class="block text-sm">
          <span class="font-medium text-foreground">{{ runtime.t('sharedConnections.connectorId', 'Connector ID') }}</span>
          <input v-model="form.connector_id" class="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground" data-test-id="shared-connections.create.connector-id">
        </label>
        <label class="block text-sm">
          <span class="font-medium text-foreground">{{ runtime.t('sharedConnections.label', 'Label') }}</span>
          <input v-model="form.label" class="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground" data-test-id="shared-connections.create.label">
        </label>
        <label class="block text-sm">
          <span class="font-medium text-foreground">{{ runtime.t('sharedConnections.principalPattern', 'Principal Pattern') }}</span>
          <input v-model="form.principal_pattern" class="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground" data-test-id="shared-connections.create.principal-pattern">
        </label>
        <label class="block text-sm">
          <span class="font-medium text-foreground">{{ runtime.t('sharedConnections.inheritsTo', 'Inherits To') }}</span>
          <input v-model="form.inherits_to" class="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground" data-test-id="shared-connections.create.inherits-to">
        </label>
        <div v-if="error" data-test-id="shared-connections.create.error" class="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {{ error }}
        </div>
        <button class="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90" :disabled="saving" data-test-id="shared-connections.create.continue">
          <span data-test-id="shared-connections.create.start-auth">
            {{ saving ? runtime.t('sharedConnections.authorizing', 'Authorizing...') : runtime.t('sharedConnections.continue', 'Continue') }}
          </span>
        </button>
      </form>
    </BundlePanel>
  </BundlePage>
</template>
