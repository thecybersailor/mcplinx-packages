<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskSharedConnectionRuntime, type SharedConnectionRecord } from '../facade'

const runtime = useRemoteTaskSharedConnectionRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const deleting = ref(false)
const authPending = ref(false)
const item = ref<SharedConnectionRecord | null>(null)
const authSession = ref<{ connection_id?: string; type?: string; url?: string; fields?: Array<Record<string, unknown>> } | null>(null)
const authData = reactive<Record<string, string>>({})
const form = reactive({
  label: '',
  principal_pattern: '',
  inherits_to: '',
})

const id = computed(() => String(route.params.id ?? ''))

async function load() {
  if (!id.value) return
  loading.value = true
  try {
    const response = await runtime.facade.getConnection(id.value)
    item.value = response
    form.label = response.label ?? ''
    form.principal_pattern = response.principal_pattern ?? ''
    form.inherits_to = (response.inherits_to ?? []).join(', ')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!id.value) return
  const updated = await runtime.facade.updateConnection(id.value, {
    label: form.label,
    principal_pattern: form.principal_pattern,
    inherits_to: form.inherits_to.split(',').map((entry) => entry.trim()).filter(Boolean),
  })
  item.value = updated
}

async function remove() {
  if (!id.value) return
  deleting.value = true
  try {
    await runtime.facade.deleteConnection(id.value)
    await router.push({ name: `${runtime.routePrefix}-connections` })
  } finally {
    deleting.value = false
  }
}

async function reauth() {
  if (!id.value) return
  authPending.value = true
  try {
    const response = await runtime.facade.reauthConnection(id.value, {
      label: form.label,
      scope: runtime.scope,
      principal_pattern: form.principal_pattern,
      inherits_to: form.inherits_to.split(',').map((entry) => entry.trim()).filter(Boolean),
    })
    authSession.value = response
    if (response.url && typeof window !== 'undefined') {
      window.location.href = response.url
    }
  } finally {
    authPending.value = false
  }
}

async function submitAuth() {
  if (!authSession.value) return
  authPending.value = true
  try {
    const updated = await runtime.facade.submitAuth({
      connection_id: authSession.value.connection_id || id.value,
      label: form.label,
      scope: runtime.scope,
      principal_pattern: form.principal_pattern,
      inherits_to: form.inherits_to.split(',').map((entry) => entry.trim()).filter(Boolean),
      auth_data: { ...authData },
    })
    item.value = updated
    authSession.value = null
  } finally {
    authPending.value = false
  }
}

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="shared-connections.detail.page"
    :title="item?.label || item?.connector_id || id"
    :description="item?.resolution_hint || runtime.t('sharedConnections.noHint', 'No resolution hint')"
  >
    <BundleState
      v-if="loading"
      variant="loading"
      :message="runtime.t('sharedConnections.loadingDetail', 'Loading connection detail...')"
      data-test-id="shared-connections.detail.loading"
    />

    <BundlePanel v-else>
      <form class="space-y-3" @submit.prevent="save">
        <label class="block text-sm">
          <span class="font-medium text-slate-700">{{ runtime.t('sharedConnections.label', 'Label') }}</span>
          <input v-model="form.label" class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" data-test-id="shared-connections.detail.label">
        </label>
        <label class="block text-sm">
          <span class="font-medium text-slate-700">{{ runtime.t('sharedConnections.principalPattern', 'Principal Pattern') }}</span>
          <input v-model="form.principal_pattern" class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" data-test-id="shared-connections.detail.principal-pattern">
        </label>
        <label class="block text-sm">
          <span class="font-medium text-slate-700">{{ runtime.t('sharedConnections.inheritsTo', 'Inherits To') }}</span>
          <input v-model="form.inherits_to" class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" data-test-id="shared-connections.detail.inherits-to">
        </label>
        <div class="flex items-center gap-2">
          <button class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" data-test-id="shared-connections.detail.save">
            {{ runtime.t('sharedConnections.save', 'Save') }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            :disabled="authPending"
            data-test-id="shared-connections.detail.reauth"
            @click="reauth"
          >
            {{ authPending ? runtime.t('sharedConnections.authorizing', 'Authorizing...') : runtime.t('sharedConnections.reauth', 'Reauthorize') }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
            :disabled="deleting"
            data-test-id="shared-connections.detail.delete"
            @click="remove"
          >
            {{ deleting ? runtime.t('sharedConnections.deleting', 'Deleting...') : runtime.t('sharedConnections.delete', 'Delete') }}
          </button>
        </div>
      </form>
    </BundlePanel>

    <BundlePanel v-if="authSession?.fields?.length" data-test-id="shared-connections.detail.auth-form">
      <div class="space-y-3">
        <div class="text-sm text-slate-600">{{ runtime.t('sharedConnections.authPrompt', 'Complete the required authorization fields to finish this shared connection.') }}</div>
        <label v-for="field in authSession.fields" :key="String(field.name ?? field.key ?? field.label ?? '')" class="block text-sm">
          <span class="font-medium text-slate-700">{{ String(field.label ?? field.name ?? field.key ?? 'Field') }}</span>
          <input
            v-model="authData[String(field.name ?? field.key ?? field.label ?? 'field')]"
            class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
            :data-test-id="`shared-connections.detail.auth-field.${String(field.name ?? field.key ?? field.label ?? 'field')}`"
          >
        </label>
        <button class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" :disabled="authPending" data-test-id="shared-connections.detail.submit-auth" @click="submitAuth">
          {{ authPending ? runtime.t('sharedConnections.authorizing', 'Authorizing...') : runtime.t('sharedConnections.submitAuth', 'Submit auth') }}
        </button>
      </div>
    </BundlePanel>
  </BundlePage>
</template>
