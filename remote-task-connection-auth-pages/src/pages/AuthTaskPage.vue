<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@mcplinx/ui-vue'
import { useConnectionAuthTaskRuntime, type ConnectionAuthTaskDetail, type ConnectionAuthTaskField } from '../facade'
import { replaceLocation } from '../navigation'

const runtime = useConnectionAuthTaskRuntime()
const route = useRoute()
const router = useRouter()

const task = ref<ConnectionAuthTaskDetail | null>(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const authData = reactive<Record<string, string>>({})

const taskId = computed(() => String(route.params.taskId ?? ''))
const authType = computed(() => String(task.value?.auth_type ?? '').toLowerCase())

const dynamicFields = computed(() => {
  if (authType.value !== 'api_key' && authType.value !== 'session') return []
  return (task.value?.fields ?? []).filter(
    (field): field is ConnectionAuthTaskField => Boolean(field) && typeof field === 'object',
  )
})

const basicFields = computed(() => {
  if (authType.value !== 'basic') return []
  return [
    { key: 'username', label: runtime.t('connectionAuthTask.basic.username', 'Username'), type: 'text', required: true },
    { key: 'password', label: runtime.t('connectionAuthTask.basic.password', 'Password'), type: 'password', required: true },
  ]
})

const visibleFields = computed(() => (basicFields.value.length ? basicFields.value : dynamicFields.value))
const canSubmit = computed(() => authType.value === 'basic' || authType.value === 'api_key' || authType.value === 'session')

function statusText(detail: ConnectionAuthTaskDetail | null) {
  switch (detail?.status) {
    case 'expired':
      return runtime.t('connectionAuthTask.status.expired', 'This auth task has expired.')
    case 'failed':
      return detail.error_message || runtime.t('connectionAuthTask.status.failed', 'Authentication failed.')
    case 'callback_processing':
      return runtime.t('connectionAuthTask.status.callback', 'Finishing authentication...')
    case 'pending_oauth_redirect':
      return runtime.t('connectionAuthTask.status.oauth', 'Redirecting to the authorization provider...')
    default:
      return ''
  }
}

function fieldKey(field: ConnectionAuthTaskField) {
  return String(field.key ?? '')
}

function fieldLabel(field: ConnectionAuthTaskField) {
  return String(field.label ?? field.key ?? runtime.t('connectionAuthTask.field.default', 'Field'))
}

function fieldType(field: ConnectionAuthTaskField) {
  const raw = String(field.type ?? 'text').toLowerCase()
  if (raw.includes('password') || raw.includes('secret')) return 'password'
  return 'text'
}

function fieldHelpText(field: ConnectionAuthTaskField) {
  return typeof field.help_text === 'string' ? field.help_text : ''
}

function seedDefaults(detail: ConnectionAuthTaskDetail) {
  for (const field of detail.fields ?? []) {
    const key = fieldKey(field)
    if (!key || authData[key] != null) continue
    authData[key] = String(field.default ?? '')
  }
  if (authType.value === 'basic') {
    authData.username ??= ''
    authData.password ??= ''
  }
}

async function redirectToProvider(url: string) {
  replaceLocation(url)
}

async function applyTask(detail: ConnectionAuthTaskDetail) {
  task.value = detail
  seedDefaults(detail)
  if (detail.status === 'succeeded') {
    await router.replace({ name: `${runtime.routePrefix}-success`, params: { taskId: taskId.value } })
    return
  }
  if (detail.provider_url && (detail.status === 'pending_oauth_redirect' || String(detail.auth_type).toLowerCase() === 'oauth2')) {
    await redirectToProvider(detail.provider_url)
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const detail = await runtime.facade.getTask(taskId.value)
    await applyTask(detail)
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('connectionAuthTask.common.error', 'Request failed.')
    task.value = null
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  error.value = ''
  try {
    const payload = visibleFields.value.reduce<Record<string, unknown>>((acc, field) => {
      const key = fieldKey(field)
      if (!key) return acc
      acc[key] = authData[key] ?? ''
      return acc
    }, {})
    const detail = await runtime.facade.submitTask(taskId.value, { auth_data: payload })
    await applyTask(detail)
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('connectionAuthTask.common.error', 'Request failed.')
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <section data-test-id="connection-auth-task.page" class="mx-auto max-w-2xl space-y-6 px-6 py-10 text-foreground">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold">{{ runtime.t('connectionAuthTask.title', 'Connection Authentication') }}</h1>
      <p class="text-sm text-muted-foreground">
        {{ task?.connection_label || task?.connector?.name || runtime.t('connectionAuthTask.subtitle', 'Finish this connection authorization with the current auth task.') }}
      </p>
    </header>

    <div v-if="loading" data-test-id="connection-auth-task.loading" class="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
      {{ runtime.t('connectionAuthTask.loading', 'Loading the auth task...') }}
    </div>

    <div v-else-if="error" data-test-id="connection-auth-task.error" class="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
      {{ error }}
    </div>

    <div
      v-else-if="task && (task.status === 'expired' || task.status === 'failed' || task.status === 'callback_processing' || task.status === 'pending_oauth_redirect')"
      data-test-id="connection-auth-task.status"
      class="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground"
    >
      {{ statusText(task) }}
    </div>

    <div
      v-else-if="task && canSubmit"
      data-test-id="shared-connections.create.auth-form"
      class="space-y-4 rounded-2xl border border-border bg-card p-6"
    >
      <form
        data-test-id="connection-auth-task.form"
        class="space-y-4"
        @submit.prevent="submit"
      >
        <div
          v-for="field in visibleFields"
          :key="fieldKey(field)"
          class="space-y-2"
        >
          <label class="text-sm font-medium text-foreground" :for="`connection-auth-field-${fieldKey(field)}`">
            {{ fieldLabel(field) }}
          </label>
          <input
            :id="`connection-auth-field-${fieldKey(field)}`"
            v-model="authData[fieldKey(field)]"
            :type="fieldType(field)"
            :required="Boolean(field.required)"
            :data-test-id="`shared-connections.create.auth-field.${fieldKey(field)}`"
            class="w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground"
          >
          <input
            v-model="authData[fieldKey(field)]"
            :type="fieldType(field)"
            tabindex="-1"
            aria-hidden="true"
            :data-test-id="`connection-auth-task.field.${fieldKey(field)}`"
            class="absolute left-0 top-0 h-px w-px opacity-0 pointer-events-none"
          >
          <p v-if="fieldHelpText(field)" class="text-xs text-muted-foreground">{{ fieldHelpText(field) }}</p>
        </div>
        <Button
          type="submit"
          :disabled="submitting"
          data-test-id="shared-connections.create.submit-auth"
        >
          {{ submitting ? runtime.t('connectionAuthTask.submitting', 'Submitting...') : runtime.t('connectionAuthTask.submit', 'Continue Authentication') }}
        </Button>
        <button
          type="submit"
          tabindex="-1"
          aria-hidden="true"
          data-test-id="connection-auth-task.submit"
          class="absolute left-0 top-0 h-px w-px opacity-0 pointer-events-none"
        />
      </form>
    </div>
  </section>
</template>
