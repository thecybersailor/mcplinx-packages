<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import { useRemoteTaskSharedConnectionRuntime } from '../facade'

const runtime = useRemoteTaskSharedConnectionRuntime()
const route = useRoute()
const router = useRouter()
const saving = ref(false)
const authPending = ref(false)
const authSession = ref<{ connection_id?: string; type?: string; url?: string; fields?: Array<Record<string, unknown>> } | null>(null)
const authData = reactive<Record<string, string>>({})
const form = reactive({
  connector_id: typeof route.query.connector_id === 'string' ? route.query.connector_id : '',
  label: '',
  principal_pattern: '',
  inherits_to: '',
})

const authFields = computed(() =>
  (authSession.value?.fields ?? []).filter(
    (field): field is Record<string, unknown> => Boolean(field) && typeof field === 'object',
  ),
)

function currentRequest() {
  return {
    connector_id: form.connector_id,
    label: form.label,
    scope: runtime.scope,
    principal_pattern: form.principal_pattern,
    inherits_to: form.inherits_to.split(',').map((item) => item.trim()).filter(Boolean),
  }
}

async function saveDraft() {
  saving.value = true
  try {
    const created = await runtime.facade.createConnection(currentRequest())
    if (created.id) {
      await router.push({ name: `${runtime.routePrefix}-detail`, params: { id: created.id } })
    }
  } finally {
    saving.value = false
  }
}

async function startAuth() {
  authPending.value = true
  try {
    const started = await runtime.facade.startAuth(currentRequest())
    authSession.value = started
    if (started.url && typeof window !== 'undefined') {
      window.location.href = started.url
    }
  } finally {
    authPending.value = false
  }
}

async function submitAuth() {
  if (!authSession.value) return
  authPending.value = true
  try {
    const created = await runtime.facade.submitAuth({
      ...currentRequest(),
      connection_id: authSession.value.connection_id,
      auth_data: { ...authData },
    })
    if (created.id) {
      await router.push({ name: `${runtime.routePrefix}-detail`, params: { id: created.id } })
    }
  } finally {
    authPending.value = false
  }
}
</script>

<template>
  <BundlePage
    data-test-id="shared-connections.create.page"
    :title="runtime.t('sharedConnections.create', 'Create Connection')"
    description="Use the same shared-connection creation form in every host."
  >
    <BundlePanel>
      <div class="mb-5 rounded-2xl border border-border bg-muted/30 p-4">
        <h2 class="text-base font-semibold text-foreground">What happens next</h2>
        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>Save creates the shared connection record immediately.</li>
          <li>Start auth opens the provider flow when authorization is required.</li>
          <li>If the provider returns extra fields, complete them below before retrying.</li>
        </ul>
      </div>
      <form class="space-y-3" @submit.prevent="saveDraft">
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
        <div class="flex flex-wrap gap-2">
          <button class="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90" :disabled="saving" data-test-id="shared-connections.create.submit">
            {{ saving ? runtime.t('sharedConnections.saving', 'Saving...') : runtime.t('sharedConnections.save', 'Save') }}
          </button>
          <button type="button" class="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground" :disabled="authPending" data-test-id="shared-connections.create.start-auth" @click="startAuth">
            {{ authPending ? runtime.t('sharedConnections.authorizing', 'Authorizing...') : runtime.t('sharedConnections.startAuth', 'Start auth') }}
          </button>
        </div>
      </form>
    </BundlePanel>

    <BundlePanel v-if="authSession && authFields.length" data-test-id="shared-connections.create.auth-form">
      <div class="space-y-3">
        <div class="text-sm text-muted-foreground">{{ runtime.t('sharedConnections.authPrompt', 'Complete the required authorization fields to finish creating this shared connection.') }}</div>
        <label v-for="field in authFields" :key="String(field.label ?? field.name ?? field.key ?? '')" class="block text-sm">
          <span class="font-medium text-foreground">{{ String(field.label ?? field.name ?? field.key ?? 'Field') }}</span>
          <input
            v-model="authData[String(field.label ?? field.name ?? field.key ?? 'field')]"
            class="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground"
            :data-test-id="`shared-connections.create.auth-field.${String(field.name ?? field.key ?? field.label ?? 'field')}`"
          >
        </label>
        <button class="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90" :disabled="authPending" data-test-id="shared-connections.create.submit-auth" @click="submitAuth">
          {{ authPending ? runtime.t('sharedConnections.authorizing', 'Authorizing...') : runtime.t('sharedConnections.submitAuth', 'Submit auth') }}
        </button>
        <p class="text-xs leading-5 text-muted-foreground">Keep the connection fields unchanged, then retry after checking the provider response.</p>
      </div>
    </BundlePanel>
  </BundlePage>
</template>
