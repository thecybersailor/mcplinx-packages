<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@mcplinx/ui-vue'
import BundlePage from '../components/BundlePage.vue'
import BundleState from '../components/BundleState.vue'
import { remoteTaskManagementPageTestId, useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const pageTestId = remoteTaskManagementPageTestId(runtime, 'instances')
const router = useRouter()
const loading = ref(true)
const error = ref('')
type RemoteInstance = Awaited<ReturnType<typeof runtime.facade.listInstances>>[number]
const instances = ref<RemoteInstance[]>([])
const status = ref<'all' | 'active' | 'pending_review' | 'rejected' | 'disabled'>('all')
const visibility = ref<'all' | 'public' | 'private'>('all')
const canViewConnections = computed(() => runtime.scope === 'team' && Boolean(runtime.sharedConnectionRoutePrefix))
const canCreateConnection = computed(() => Boolean(runtime.sharedConnectionRoutePrefix))

function nameOf(suffix: string) {
  return `${runtime.routePrefix}-${suffix}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    instances.value = await runtime.facade.listInstances(status.value === 'all' ? undefined : { status: status.value })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
    instances.value = []
  } finally {
    loading.value = false
  }
}

function detail(id?: number) {
  if (id == null) return
  void router.push({ name: nameOf('instance-detail'), params: { instanceId: String(id) } })
}

function connect(id?: number) {
  if (id == null || !runtime.sharedConnectionRoutePrefix) return
  void router.push({
    name: `${runtime.sharedConnectionRoutePrefix}-create`,
    query: { connector_id: String(id) },
  })
}

const filteredInstances = computed(() => {
  return instances.value.filter((instance) => {
    if (visibility.value === 'all') return true
    return (instance.visibility || '').toLowerCase() === visibility.value
  })
})

function ownerLabelOf(instance: RemoteInstance) {
  return instance.ownerName || instance.ownerID || instance.ownerId || '-'
}

function statusClassOf(instance: RemoteInstance) {
  switch (instance.status) {
    case 'active':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100'
    case 'pending_review':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-100'
    case 'rejected':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-100'
    default:
      return 'border-border bg-muted text-muted-foreground'
  }
}

onMounted(load)
</script>

<template>
  <BundlePage
    :data-test-id="pageTestId"
    borderless
    :title="runtime.t('remoteTaskManagement.instances.title', 'Connector Instances')"
  >
    <template #actions>
      <Button variant="outline" @click="load">{{ runtime.t('remoteTaskManagement.instances.refresh', 'Refresh') }}</Button>
      <Select v-model="status" @update:modelValue="load">
        <SelectTrigger data-test-id="remote-task-management.instances.status" class="w-[150px] rounded-xl border-input bg-background text-foreground hover:bg-accent/50">
          <SelectValue :placeholder="runtime.t('remoteTaskManagement.instances.statusAll', 'All Status')" />
        </SelectTrigger>
        <SelectContent class="border-border bg-popover text-popover-foreground">
          <SelectItem value="all">{{ runtime.t('remoteTaskManagement.instances.statusAll', 'All Status') }}</SelectItem>
          <SelectItem value="active">{{ runtime.t('remoteTaskManagement.instances.statusActive', 'Active') }}</SelectItem>
          <SelectItem value="pending_review">{{ runtime.t('remoteTaskManagement.instances.statusPending', 'Pending Review') }}</SelectItem>
          <SelectItem value="rejected">{{ runtime.t('remoteTaskManagement.instances.statusRejected', 'Rejected') }}</SelectItem>
          <SelectItem value="disabled">{{ runtime.t('remoteTaskManagement.instances.statusDisabled', 'Disabled') }}</SelectItem>
        </SelectContent>
      </Select>
      <Select v-model="visibility">
        <SelectTrigger data-test-id="remote-task-management.instances.visibility" class="w-[140px] rounded-xl border-input bg-background text-foreground hover:bg-accent/50">
          <SelectValue :placeholder="runtime.t('remoteTaskManagement.instances.visibilityAll', 'All Visibility')" />
        </SelectTrigger>
        <SelectContent class="border-border bg-popover text-popover-foreground">
          <SelectItem value="all">{{ runtime.t('remoteTaskManagement.instances.visibilityAll', 'All Visibility') }}</SelectItem>
          <SelectItem value="public">{{ runtime.t('remoteTaskManagement.instances.visibilityPublic', 'Public') }}</SelectItem>
          <SelectItem value="private">{{ runtime.t('remoteTaskManagement.instances.visibilityPrivate', 'Private') }}</SelectItem>
        </SelectContent>
      </Select>
      <Button
        v-if="canViewConnections"
        data-test-id="remote-task-management.instances.open-connections"
        variant="outline"
        @click="router.push({ name: nameOf('connections') })"
      >
        {{ runtime.t('remoteTaskManagement.instances.viewConnections', 'View Connections') }}
      </Button>
    </template>

    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskManagement.instances.loading', 'Loading instances...')" />
    <BundleState v-else-if="error" variant="error" :message="error" :action-label="runtime.t('remoteTaskManagement.instances.refresh', 'Refresh')" @action="load" />
    <div v-else-if="!filteredInstances.length" class="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
      <div class="text-lg font-semibold text-foreground">{{ runtime.t('remoteTaskManagement.instances.empty', 'No instances found') }}</div>
    </div>
    <div v-else class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Table data-test-id="remote-task-management.instances.table">
        <TableHeader class="bg-muted/30">
          <TableRow class="border-border hover:bg-transparent">
            <TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.instances.instance', 'Instance') }}</TableHead>
            <TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.instances.package', 'Package') }}</TableHead>
            <TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.instances.owner', 'Owner') }}</TableHead>
            <TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.instances.visibility', 'Visibility') }}</TableHead>
            <TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.instances.status', 'Status') }}</TableHead>
            <TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.instances.version', 'Version') }}</TableHead>
            <TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.instances.actions', 'Actions') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
          v-for="instance in filteredInstances"
          :key="instance.id"
          :data-test-id="`remote-task-management.instances.row.${instance.id}`"
          class="cursor-pointer border-border transition hover:bg-muted/50"
        >
            <TableCell @click="detail(instance.id)">
              <div class="font-medium text-foreground">{{ instance.name || instance.id }}</div>
              <div class="text-sm leading-6 text-muted-foreground">{{ instance.instance_description || '-' }}</div>
            </TableCell>
            <TableCell class="text-foreground">{{ instance.pkgName || instance.pkg_id || '-' }}</TableCell>
            <TableCell class="text-foreground">{{ ownerLabelOf(instance) }}</TableCell>
            <TableCell class="text-foreground">{{ instance.visibility || '-' }}</TableCell>
            <TableCell>
              <span class="rounded-full border px-3 py-1 text-xs font-medium" :class="statusClassOf(instance)">
                {{ instance.status || 'unknown' }}
              </span>
            </TableCell>
            <TableCell class="text-muted-foreground">{{ instance.activeVersion || '-' }}</TableCell>
            <TableCell>
              <div class="flex flex-wrap gap-2">
                <Button
                  v-if="canCreateConnection"
                  :data-test-id="`remote-task-management.instances.connect.${instance.id}`"
                  variant="outline"
                  size="sm"
                  @click="connect(instance.id)"
                >
                  {{ runtime.t('remoteTaskManagement.instances.connect', 'Connect') }}
                </Button>
                <Button variant="outline" size="sm" @click="detail(instance.id)">
                  {{ runtime.t('remoteTaskManagement.instances.details', 'Details') }}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </BundlePage>
</template>
