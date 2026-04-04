<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@mcplinx/ui-vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskManagementRuntime } from '../facade'

type EnvVarRow = {
  id: string
  key: string
  value: string
}

type SecretVarRow = {
  id: string
  key: string
  value: string
  configured?: boolean
}

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
const envVars = ref<EnvVarRow[]>([])
const secretVars = ref<SecretVarRow[]>([])
let configRowId = 0

function nextConfigRowId() {
  configRowId += 1
  return `config-row-${configRowId}`
}

function syncConfigState() {
  envVars.value = Object.entries(instance.value?.envConfig || {}).map(([key, value]) => ({
    id: nextConfigRowId(),
    key,
    value: String(value ?? ''),
  }))
  secretVars.value = Object.entries(instance.value?.secretConfig || {}).map(([key, configured]) => ({
    id: nextConfigRowId(),
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
  envVars.value.push({ id: nextConfigRowId(), key: '', value: '' })
}

function removeEnvVar(index: number) {
  envVars.value.splice(index, 1)
}

function addSecretVar() {
  secretVars.value.push({ id: nextConfigRowId(), key: '', value: '', configured: false })
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
            <h2 class="text-base font-semibold text-foreground">{{ runtime.t('remoteTaskManagement.instances.activeDeployment', 'Active Deployment') }}</h2>
            <p class="mt-1 text-sm text-muted-foreground">{{ runtime.t('remoteTaskManagement.instances.activeDeploymentDesc', 'Active deployment shows the version that is currently serving traffic.') }}</p>
          </div>
        </div>
        <div class="overflow-hidden rounded-2xl border border-border bg-muted/30">
          <div class="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-muted-foreground">
            <span>{{ runtime.t('remoteTaskManagement.instances.deployedAt', 'Deployed {time}', { time: instance.updatedAt || '-' }) }}</span>
            <span>via Syntool</span>
          </div>
          <div class="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="flex items-center gap-4">
              <div class="h-10 w-1 rounded-full bg-emerald-400"></div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono font-medium text-foreground">{{ instance.activeVersion || '-' }}</span>
                  <span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-200">{{ runtime.t('remoteTaskManagement.instances.latest', 'Latest') }}</span>
                </div>
                <div class="mt-2 text-sm text-muted-foreground">{{ instance.status || '-' }}</div>
              </div>
            </div>
            <div class="space-y-2 text-right text-sm text-muted-foreground">
              <div>{{ instance.visibility || 'private' }}</div>
              <div v-if="instance.oauthCallbackURL" class="break-all">
                {{ runtime.t('remoteTaskManagement.instances.callback', 'Callback') }}: <code class="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{{ instance.oauthCallbackURL }}</code>
              </div>
            </div>
          </div>
        </div>
      </BundlePanel>
      <BundlePanel class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-foreground">{{ runtime.t('remoteTaskManagement.instances.vars', 'Variables') }}</h2>
            <p class="mt-1 text-sm text-muted-foreground">{{ runtime.t('remoteTaskManagement.instances.varsDesc', 'Non-sensitive configuration values.') }}</p>
          </div>
          <Button :disabled="savingConfig" @click="saveConfig">
            {{ savingConfig ? runtime.t('remoteTaskManagement.common.saving', 'Saving...') : runtime.t('remoteTaskManagement.common.saveChanges', 'Save Changes') }}
          </Button>
        </div>
        <div class="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader class="bg-muted/30"><TableRow class="border-border hover:bg-transparent"><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.key', 'Key') }}</TableHead><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.value', 'Value') }}</TableHead><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.actions', 'Actions') }}</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow v-for="(item, index) in envVars" :key="item.id" class="border-t border-border hover:bg-transparent">
                <TableCell><input v-model="item.key" class="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground outline-none" placeholder="KEY_NAME" /></TableCell>
                <TableCell><input v-model="item.value" class="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground outline-none" placeholder="value" /></TableCell>
                <TableCell><Button variant="outline" size="sm" @click="removeEnvVar(index)">{{ runtime.t('remoteTaskManagement.common.delete', 'Delete') }}</Button></TableCell>
              </TableRow>
              <TableRow class="border-t border-border hover:bg-transparent">
                <TableCell colspan="3">
                  <Button variant="outline" class="w-full border-dashed border-border" @click="addEnvVar">
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
          <h2 class="text-base font-semibold text-foreground">{{ runtime.t('remoteTaskManagement.instances.secrets', 'Secrets') }}</h2>
          <p class="mt-1 text-sm text-muted-foreground">{{ runtime.t('remoteTaskManagement.instances.secretsDesc', 'Sensitive values remain masked in the detail surface.') }}</p>
        </div>
        <div class="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader class="bg-muted/30"><TableRow class="border-border hover:bg-transparent"><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.key', 'Key') }}</TableHead><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.value', 'Value') }}</TableHead><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.actions', 'Actions') }}</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow v-for="(item, index) in secretVars" :key="item.id" class="border-t border-border hover:bg-transparent">
                <TableCell><input v-model="item.key" class="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground outline-none" placeholder="SECRET_KEY" /></TableCell>
                <TableCell><input v-model="item.value" type="password" class="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground outline-none" :placeholder="item.configured && !item.value ? runtime.t('remoteTaskManagement.instances.secretSet', '••••••• (Set)') : runtime.t('remoteTaskManagement.instances.secretVal', 'secret value')" /></TableCell>
                <TableCell><Button variant="outline" size="sm" @click="removeSecretVar(index)">{{ runtime.t('remoteTaskManagement.common.delete', 'Delete') }}</Button></TableCell>
              </TableRow>
              <TableRow class="border-t border-border hover:bg-transparent">
                <TableCell colspan="3">
                  <Button variant="outline" class="w-full border-dashed border-border" @click="addSecretVar">
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
            <h2 class="text-base font-semibold text-foreground">{{ runtime.t('remoteTaskManagement.instances.versionHistory', 'Version History') }}</h2>
            <p class="mt-1 text-sm text-muted-foreground">{{ runtime.t('remoteTaskManagement.instances.versionHistoryDesc', 'Version history tracks code and configuration changes for this instance.') }}</p>
          </div>
          <Button variant="outline">{{ runtime.t('remoteTaskManagement.instances.deployVersion', 'Deploy version') }}</Button>
        </div>
        <div v-if="instance.versions?.length" class="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader class="bg-muted/30"><TableRow class="border-border hover:bg-transparent"><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.version', 'Version') }}</TableHead><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.tools', 'Tools') }}</TableHead><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.created', 'Created') }}</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow v-for="version in instance.versions" :key="version.id || version.version" class="border-border hover:bg-muted/25" :class="{ 'bg-muted/40': version.version === instance.activeVersion }">
                <TableCell class="text-foreground">{{ version.version || '-' }}</TableCell>
                <TableCell class="text-muted-foreground">{{ version.toolCount || 0 }}</TableCell>
                <TableCell class="text-muted-foreground">{{ version.createdAt || '-' }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p v-else class="text-sm text-muted-foreground">{{ runtime.t('remoteTaskManagement.instances.noHistory', 'No version history available.') }}</p>
      </BundlePanel>
      <BundlePanel v-if="canModerate" class="space-y-3">
        <label class="grid gap-2">
          <span class="text-sm font-medium text-foreground">{{ runtime.t('remoteTaskManagement.instances.reviewReason', 'Review reason') }}</span>
          <textarea v-model="reviewReason" data-test-id="remote-task-management.instance-detail.reason" class="min-h-24 rounded-xl border border-input bg-background px-3 py-2 text-foreground" />
        </label>
        <div class="flex flex-wrap gap-2">
          <Button data-test-id="remote-task-management.instance-detail.approve" @click="review('approve')">{{ runtime.t('remoteTaskManagement.instances.approve', 'Approve') }}</Button>
          <Button data-test-id="remote-task-management.instance-detail.reject" variant="destructive" @click="review('reject')">{{ runtime.t('remoteTaskManagement.instances.reject', 'Reject') }}</Button>
        </div>
      </BundlePanel>
    </div>
  </BundlePage>
</template>
