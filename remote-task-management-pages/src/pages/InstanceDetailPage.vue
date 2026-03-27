<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@mcplinx/ui-vue'
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
    const secretConfig = Object.fromEntries(
      secretVars.value
        .filter((item) => item.key.trim() && item.value)
        .map((item) => [item.key.trim(), item.value]),
    )
    await runtime.facade.updateInstance(String(instance.value.id), {
      pkg_id: String(instance.value.pkg_id || ''),
      name: instance.value.name || '',
      active_version: instance.value.activeVersion || '',
      description: instance.value.description || undefined,
      visibility: instance.value.visibility || undefined,
      env_config: envConfig,
      secret_config: secretConfig,
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
    :title="instance?.name || String(instance?.id || runtime.t('remoteTaskManagement.instances.detailTitle', 'Instance detail'))"
    :description="instance ? runtime.t('remoteTaskManagement.instances.idLabel', 'Instance ID: {id}', { id: instance.id }) : runtime.t('remoteTaskManagement.instances.detailTitle', 'Instance detail')"
  >
    <template #actions>
      <Button variant="outline" @click="router.back()">{{ runtime.t('remoteTaskManagement.common.back', 'Back') }}</Button>
    </template>

    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskManagement.common.loading', 'Loading...')" />
    <BundleState v-else-if="error" variant="error" :message="error" />
    <div v-else-if="instance" class="space-y-4">
      <BundlePanel>
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-white">{{ runtime.t('remoteTaskManagement.instances.activeDeployment', 'Active Deployment') }}</h2>
            <p class="mt-1 text-sm text-slate-400">{{ runtime.t('remoteTaskManagement.instances.activeDeploymentDesc', 'Active deployment shows the version that is currently serving traffic.') }}</p>
          </div>
        </div>
        <div class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div class="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-slate-400">
            <span>{{ runtime.t('remoteTaskManagement.instances.deployedAt', 'Deployed {time}', { time: instance.updatedAt || '-' }) }}</span>
            <span>via Syntool</span>
          </div>
          <div class="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="flex items-center gap-4">
              <div class="h-10 w-1 rounded-full bg-emerald-400"></div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono font-medium text-white">{{ instance.activeVersion || '-' }}</span>
                  <span class="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-200">{{ runtime.t('remoteTaskManagement.instances.latest', 'Latest') }}</span>
                </div>
                <div class="mt-2 text-sm text-slate-400">{{ instance.status || '-' }}</div>
              </div>
            </div>
            <div class="space-y-2 text-right text-sm text-slate-400">
              <div>{{ instance.visibility || 'private' }}</div>
              <div v-if="instance.oauthCallbackURL" class="break-all">
                {{ runtime.t('remoteTaskManagement.instances.callback', 'Callback') }}: <code class="rounded bg-slate-950 px-1.5 py-0.5 text-xs text-slate-100">{{ instance.oauthCallbackURL }}</code>
              </div>
            </div>
          </div>
        </div>
      </BundlePanel>
      <BundlePanel class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-white">{{ runtime.t('remoteTaskManagement.instances.vars', 'Variables') }}</h2>
            <p class="mt-1 text-sm text-slate-400">{{ runtime.t('remoteTaskManagement.instances.varsDesc', 'Non-sensitive configuration values.') }}</p>
          </div>
          <Button :disabled="savingConfig" @click="saveConfig">
            {{ savingConfig ? runtime.t('remoteTaskManagement.common.saving', 'Saving...') : runtime.t('remoteTaskManagement.common.saveChanges', 'Save Changes') }}
          </Button>
        </div>
        <div class="overflow-hidden rounded-2xl border border-white/10">
          <Table>
            <TableHeader class="bg-white/[0.02]"><TableRow class="border-white/10 hover:bg-transparent"><TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.common.key', 'Key') }}</TableHead><TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.common.value', 'Value') }}</TableHead><TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.common.actions', 'Actions') }}</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow v-for="(item, index) in envVars" :key="`${item.key}-${index}`" class="border-t border-white/10 hover:bg-transparent">
                <TableCell><input v-model="item.key" class="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 outline-none" placeholder="KEY_NAME" /></TableCell>
                <TableCell><input v-model="item.value" class="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 outline-none" placeholder="value" /></TableCell>
                <TableCell><Button variant="outline" size="sm" @click="removeEnvVar(index)">{{ runtime.t('remoteTaskManagement.common.delete', 'Delete') }}</Button></TableCell>
              </TableRow>
              <TableRow class="border-t border-white/10 hover:bg-transparent">
                <TableCell colspan="3">
                  <Button variant="outline" class="w-full border-dashed border-white/12" @click="addEnvVar">
                    {{ runtime.t('remoteTaskManagement.instances.addVar', 'Add Variable') }}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </BundlePanel>
      <BundlePanel class="space-y-4">
        <div>
          <h2 class="text-base font-semibold text-white">{{ runtime.t('remoteTaskManagement.instances.secrets', 'Secrets') }}</h2>
          <p class="mt-1 text-sm text-slate-400">{{ runtime.t('remoteTaskManagement.instances.secretsDesc', 'Sensitive values remain masked in the detail surface.') }}</p>
        </div>
        <div class="overflow-hidden rounded-2xl border border-white/10">
          <Table>
            <TableHeader class="bg-white/[0.02]"><TableRow class="border-white/10 hover:bg-transparent"><TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.common.key', 'Key') }}</TableHead><TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.common.value', 'Value') }}</TableHead><TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.common.actions', 'Actions') }}</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow v-for="(item, index) in secretVars" :key="`${item.key}-${index}`" class="border-t border-white/10 hover:bg-transparent">
                <TableCell><input v-model="item.key" class="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 outline-none" placeholder="SECRET_KEY" /></TableCell>
                <TableCell><input v-model="item.value" type="password" class="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 outline-none" :placeholder="item.configured && !item.value ? runtime.t('remoteTaskManagement.instances.secretSet', '••••••• (Set)') : runtime.t('remoteTask मैनेजमेंट.instances.secretVal', 'secret value')" /></TableCell>
                <TableCell><Button variant="outline" size="sm" @click="removeSecretVar(index)">{{ runtime.t('remoteTaskManagement.common.delete', 'Delete') }}</Button></TableCell>
              </TableRow>
              <TableRow class="border-t border-white/10 hover:bg-transparent">
                <TableCell colspan="3">
                  <Button variant="outline" class="w-full border-dashed border-white/12" @click="addSecretVar">
                    {{ runtime.t('remoteTaskManagement.instances.addSecret', 'Add Secret') }}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </BundlePanel>
      <BundlePanel>
        <div class="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-white">{{ runtime.t('remoteTaskManagement.instances.versionHistory', 'Version History') }}</h2>
            <p class="mt-1 text-sm text-slate-400">{{ runtime.t('remoteTaskManagement.instances.versionHistoryDesc', 'Version history tracks code and configuration changes for this instance.') }}</p>
          </div>
          <Button variant="outline">{{ runtime.t('remoteTaskManagement.instances.deployVersion', 'Deploy version') }}</Button>
        </div>
        <div v-if="instance.versions?.length" class="overflow-hidden rounded-2xl border border-slate-200">
          <Table>
            <TableHeader class="bg-white/[0.02]"><TableRow class="border-white/10 hover:bg-transparent"><TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.common.version', 'Version') }}</TableHead><TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.common.tools', 'Tools') }}</TableHead><TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.common.created', 'Created') }}</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow v-for="version in instance.versions" :key="version.id || version.version" class="border-white/10 hover:bg-[rgba(255,255,255,0.02)]" :class="{ 'bg-white/[0.03]': version.version === instance.activeVersion }">
                <TableCell class="text-slate-100">{{ version.version || '-' }}</TableCell>
                <TableCell class="text-slate-300">{{ version.toolCount || 0 }}</TableCell>
                <TableCell class="text-slate-300">{{ version.createdAt || '-' }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p v-else class="text-sm text-slate-400">{{ runtime.t('remoteTaskManagement.instances.noHistory', 'No version history available.') }}</p>
      </BundlePanel>
      <BundlePanel v-if="canModerate" class="space-y-3">
        <label class="grid gap-2">
          <span class="text-sm font-medium text-slate-700">{{ runtime.t('remoteTaskManagement.instances.reviewReason', 'Review reason') }}</span>
          <textarea v-model="reviewReason" data-test-id="remote-task-management.instance-detail.reason" class="min-h-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" />
        </label>
        <div class="flex flex-wrap gap-2">
          <Button data-test-id="remote-task-management.instance-detail.approve" @click="review('approve')">{{ runtime.t('remoteTaskManagement.instances.approve', 'Approve') }}</Button>
          <Button data-test-id="remote-task-management.instance-detail.reject" variant="destructive" @click="review('reject')">{{ runtime.t('remoteTaskManagement.instances.reject', 'Reject') }}</Button>
        </div>
      </BundlePanel>
    </div>
  </BundlePage>
</template>
