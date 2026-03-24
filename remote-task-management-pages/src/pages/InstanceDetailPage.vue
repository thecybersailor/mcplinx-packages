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
const instanceId = computed(() => String(route.params.instanceId ?? ''))
const canModerate = computed(() => runtime.scope !== 'team' && typeof runtime.facade.reviewInstance === 'function')

async function load() {
  if (!instanceId.value) return
  loading.value = true
  error.value = ''
  try {
    instance.value = await runtime.facade.getInstance(instanceId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
    instance.value = null
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

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="remote-task-management.instance-detail.page"
    :title="instance?.name || String(instance?.id || 'Instance detail')"
    description="Unified moderation detail surface."
  >
    <template #actions>
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="router.back()">Back</button>
    </template>

    <BundleState v-if="loading" variant="loading" message="Loading..." />
    <BundleState v-else-if="error" variant="error" :message="error" />
    <div v-else-if="instance" class="space-y-4">
      <BundlePanel>
        <dl class="grid gap-3 md:grid-cols-2">
          <div><dt class="text-xs uppercase tracking-wide text-slate-400">Status</dt><dd class="mt-1 text-sm text-slate-800">{{ instance.status || '-' }}</dd></div>
          <div><dt class="text-xs uppercase tracking-wide text-slate-400">Visibility</dt><dd class="mt-1 text-sm text-slate-800">{{ instance.visibility || '-' }}</dd></div>
          <div><dt class="text-xs uppercase tracking-wide text-slate-400">Version</dt><dd class="mt-1 text-sm text-slate-800">{{ instance.activeVersion || '-' }}</dd></div>
          <div><dt class="text-xs uppercase tracking-wide text-slate-400">Package ID</dt><dd class="mt-1 text-sm text-slate-800">{{ instance.pkgID || '-' }}</dd></div>
        </dl>
      </BundlePanel>
      <BundlePanel>
        <h2 class="mb-3 text-base font-semibold text-slate-950">Active Deployment</h2>
        <dl class="grid gap-3 md:grid-cols-2">
          <div><dt class="text-xs uppercase tracking-wide text-slate-400">Version</dt><dd class="mt-1 text-sm text-slate-800">{{ instance.activeVersion || '-' }}</dd></div>
          <div><dt class="text-xs uppercase tracking-wide text-slate-400">Updated</dt><dd class="mt-1 text-sm text-slate-800">{{ instance.updatedAt || '-' }}</dd></div>
          <div><dt class="text-xs uppercase tracking-wide text-slate-400">OAuth Callback</dt><dd class="mt-1 break-all text-sm text-slate-800">{{ instance.oauthCallbackURL || '-' }}</dd></div>
          <div><dt class="text-xs uppercase tracking-wide text-slate-400">Status</dt><dd class="mt-1 text-sm text-slate-800">{{ instance.status || '-' }}</dd></div>
        </dl>
      </BundlePanel>
      <BundlePanel>
        <h2 class="mb-3 text-base font-semibold text-slate-950">Variables</h2>
        <div v-if="instance.envConfig && Object.keys(instance.envConfig).length" class="space-y-2">
          <div v-for="(value, key) in instance.envConfig" :key="key" class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <span class="text-sm font-medium text-slate-700">{{ key }}</span>
            <span class="text-sm text-slate-500">{{ value }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-slate-500">No variables configured.</p>
      </BundlePanel>
      <BundlePanel>
        <h2 class="mb-3 text-base font-semibold text-slate-950">Secrets</h2>
        <div v-if="instance.secretConfig && Object.keys(instance.secretConfig).length" class="space-y-2">
          <div v-for="(configured, key) in instance.secretConfig" :key="key" class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <span class="text-sm font-medium text-slate-700">{{ key }}</span>
            <span class="text-sm text-slate-500">{{ configured ? 'Configured' : 'Missing' }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-slate-500">No secrets declared.</p>
      </BundlePanel>
      <BundlePanel>
        <h2 class="mb-3 text-base font-semibold text-slate-950">Version History</h2>
        <div v-if="instance.versions?.length" class="overflow-hidden rounded-2xl border border-slate-200">
          <table class="min-w-full bg-white">
            <thead class="bg-slate-50 text-left text-sm text-slate-500"><tr><th class="px-4 py-3 font-medium">Version</th><th class="px-4 py-3 font-medium">Tools</th><th class="px-4 py-3 font-medium">Created</th></tr></thead>
            <tbody>
              <tr v-for="version in instance.versions" :key="version.id || version.version" class="border-t border-slate-200">
                <td class="px-4 py-4 text-slate-800">{{ version.version || '-' }}</td>
                <td class="px-4 py-4 text-slate-600">{{ version.toolCount || 0 }}</td>
                <td class="px-4 py-4 text-slate-600">{{ version.createdAt || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-slate-500">No version history available.</p>
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
