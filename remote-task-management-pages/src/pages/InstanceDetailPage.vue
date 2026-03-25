<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const reviewReason = ref('')
const instance = ref<Awaited<ReturnType<typeof runtime.facade.getInstance>> | null>(null)
const savingConfig = ref(false)
const instanceId = computed(() => String(route.params.instanceId ?? ''))
const canModerate = computed(() => runtime.scope !== 'team' && typeof runtime.facade.reviewInstance === 'function')
const envVars = ref<Array<{ key: string; value: string }>>([])
const secretVars = ref<Array<{ key: string; value: string; configured?: boolean }>>([])

function syncConfigState() {
  envVars.value = Object.entries(instance.value?.envConfig || {}).map(([key, value]) => ({
    key,
    value: String(value ?? ''),
  }))
  secretVars.value = Object.entries(instance.value?.secretConfig || {}).map(([key, configured]) => ({
    key,
    value: '',
    configured: Boolean(configured),
  }))
}

async function load() {
  if (!instanceId.value) return
  loading.value = true
  error.value = ''
  try {
    instance.value = await runtime.facade.getInstance(instanceId.value)
    syncConfigState()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
    instance.value = null
    envVars.value = []
    secretVars.value = []
  } finally {
    loading.value = false
  }
}

async function review(action: 'approve' | 'reject') {
  if (!instanceId.value || !runtime.facade.reviewInstance) return
  await runtime.facade.reviewInstance(instanceId.value, {
    action,
    reason: reviewReason.value || undefined,
  })
  await load()
}

function addEnvVar() {
  envVars.value.push({ key: '', value: '' })
}

function removeEnvVar(index: number) {
  envVars.value.splice(index, 1)
}

function addSecretVar() {
  secretVars.value.push({ key: '', value: '', configured: false })
}

function removeSecretVar(index: number) {
  secretVars.value.splice(index, 1)
}

async function saveConfig() {
  if (!runtime.facade.updateInstance || !instance.value) return
  savingConfig.value = true
  try {
    const envConfig = Object.fromEntries(
      envVars.value
        .filter((item) => item.key.trim())
        .map((item) => [item.key.trim(), item.value]),
    )
    await runtime.facade.updateInstance(String(instance.value.id), {
      pkg_id: String(instance.value.pkgID || ''),
      name: instance.value.name || '',
      active_version: instance.value.activeVersion || '',
      description: instance.value.description || undefined,
      visibility: instance.value.visibility || undefined,
      env_config: envConfig,
    })
    await load()
  } finally {
    savingConfig.value = false
  }
}

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="remote-task-management.instance-detail.page"
    :title="instance?.name || String(instance?.id || 'Instance detail')"
    :description="instance ? `Instance ID: ${instance.id}` : 'Instance detail'"
  >
    <template #actions>
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="router.back()">Back</button>
    </template>

    <BundleState v-if="loading" variant="loading" message="Loading..." />
    <BundleState v-else-if="error" variant="error" :message="error" />
    <div v-else-if="instance" class="space-y-4">
      <BundlePanel>
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-white">Active Deployment</h2>
            <p class="mt-1 text-sm text-slate-400">Active deployment shows the version that is currently serving traffic.</p>
          </div>
        </div>
        <div class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div class="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-slate-400">
            <span>Deployed {{ instance.updatedAt || '-' }}</span>
            <span>via Syntool</span>
          </div>
          <div class="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="flex items-center gap-4">
              <div class="h-10 w-1 rounded-full bg-emerald-400"></div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono font-medium text-white">{{ instance.activeVersion || '-' }}</span>
                  <span class="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-200">Latest</span>
                </div>
                <div class="mt-2 text-sm text-slate-400">{{ instance.status || '-' }}</div>
              </div>
            </div>
            <div class="space-y-2 text-right text-sm text-slate-400">
              <div>{{ instance.visibility || 'private' }}</div>
              <div v-if="instance.oauthCallbackURL" class="break-all">
                Callback: <code class="rounded bg-slate-950 px-1.5 py-0.5 text-xs text-slate-100">{{ instance.oauthCallbackURL }}</code>
              </div>
            </div>
          </div>
        </div>
      </BundlePanel>
      <BundlePanel class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-white">Variables</h2>
            <p class="mt-1 text-sm text-slate-400">Non-sensitive configuration values.</p>
          </div>
          <button class="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60" :disabled="savingConfig" @click="saveConfig">
            {{ savingConfig ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
        <div class="overflow-hidden rounded-2xl border border-white/10">
          <table class="min-w-full bg-transparent">
            <thead class="bg-white/[0.02] text-left text-sm text-slate-400"><tr><th class="px-4 py-3 font-medium">Key</th><th class="px-4 py-3 font-medium">Value</th><th class="px-4 py-3 font-medium">Actions</th></tr></thead>
            <tbody>
              <tr v-for="(item, index) in envVars" :key="`${item.key}-${index}`" class="border-t border-white/10">
                <td class="px-4 py-3"><input v-model="item.key" class="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 outline-none" placeholder="KEY_NAME" /></td>
                <td class="px-4 py-3"><input v-model="item.value" class="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 outline-none" placeholder="value" /></td>
                <td class="px-4 py-3"><button class="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.04]" @click="removeEnvVar(index)">Delete</button></td>
              </tr>
              <tr class="border-t border-white/10">
                <td colspan="3" class="px-4 py-3"><button class="w-full rounded-xl border border-dashed border-white/12 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.04]" @click="addEnvVar">Add Variable</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </BundlePanel>
      <BundlePanel class="space-y-4">
        <div>
          <h2 class="text-base font-semibold text-white">Secrets</h2>
          <p class="mt-1 text-sm text-slate-400">Sensitive values remain masked in the detail surface.</p>
        </div>
        <div class="overflow-hidden rounded-2xl border border-white/10">
          <table class="min-w-full bg-transparent">
            <thead class="bg-white/[0.02] text-left text-sm text-slate-400"><tr><th class="px-4 py-3 font-medium">Key</th><th class="px-4 py-3 font-medium">Value</th><th class="px-4 py-3 font-medium">Actions</th></tr></thead>
            <tbody>
              <tr v-for="(item, index) in secretVars" :key="`${item.key}-${index}`" class="border-t border-white/10">
                <td class="px-4 py-3"><input v-model="item.key" class="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 outline-none" placeholder="SECRET_KEY" /></td>
                <td class="px-4 py-3"><input v-model="item.value" type="password" class="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 outline-none" :placeholder="item.configured && !item.value ? '••••••• (Set)' : 'secret value'" /></td>
                <td class="px-4 py-3"><button class="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.04]" @click="removeSecretVar(index)">Delete</button></td>
              </tr>
              <tr class="border-t border-white/10">
                <td colspan="3" class="px-4 py-3"><button class="w-full rounded-xl border border-dashed border-white/12 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.04]" @click="addSecretVar">Add Secret</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </BundlePanel>
      <BundlePanel>
        <div class="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-white">Version History</h2>
            <p class="mt-1 text-sm text-slate-400">Version history tracks code and configuration changes for this instance.</p>
          </div>
          <button class="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]">Deploy version</button>
        </div>
        <div v-if="instance.versions?.length" class="overflow-hidden rounded-2xl border border-slate-200">
          <table class="min-w-full bg-transparent">
            <thead class="bg-white/[0.02] text-left text-sm text-slate-400"><tr><th class="px-4 py-3 font-medium">Version</th><th class="px-4 py-3 font-medium">Tools</th><th class="px-4 py-3 font-medium">Created</th></tr></thead>
            <tbody>
              <tr v-for="version in instance.versions" :key="version.id || version.version" class="border-t border-white/10" :class="{ 'bg-white/[0.03]': version.version === instance.activeVersion }">
                <td class="px-4 py-4 text-slate-100">{{ version.version || '-' }}</td>
                <td class="px-4 py-4 text-slate-300">{{ version.toolCount || 0 }}</td>
                <td class="px-4 py-4 text-slate-300">{{ version.createdAt || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-slate-400">No version history available.</p>
      </BundlePanel>
      <BundlePanel v-if="canModerate" class="space-y-3">
        <label class="grid gap-2">
          <span class="text-sm font-medium text-slate-700">Review reason</span>
          <textarea v-model="reviewReason" data-test-id="remote-task-management.instance-detail.reason" class="min-h-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" />
        </label>
        <div class="flex flex-wrap gap-2">
          <button data-test-id="remote-task-management.instance-detail.approve" class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" @click="review('approve')">Approve</button>
          <button data-test-id="remote-task-management.instance-detail.reject" class="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100" @click="review('reject')">Reject</button>
        </div>
      </BundlePanel>
    </div>
  </BundlePage>
</template>
