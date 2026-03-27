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
      return 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100'
    case 'pending_review':
      return 'border-amber-400/25 bg-amber-500/10 text-amber-100'
    case 'rejected':
      return 'border-rose-400/25 bg-rose-500/10 text-rose-100'
    default:
      return 'border-white/10 bg-black/20 text-slate-300'
  }
}

onMounted(load)
</script>

<template>
  <BundlePage :data-test-id="pageTestId" :title="runtime.t('remoteTaskManagement.instances.title', 'Connector Instances')">
    <template #actions>
      <Button variant="outline" @click="load">{{ runtime.t('remoteTaskManagement.instances.refresh', 'Refresh') }}</Button>
      <Select v-model="status" @update:modelValue="load">
        <SelectTrigger data-test-id="remote-task-management.instances.status" class="w-[150px] rounded-xl border-white/12 bg-white/[0.04] text-slate-100 hover:border-white/20">
          <SelectValue :placeholder="runtime.t('remoteTaskManagement.instances.statusAll', 'All Status')" />
        </SelectTrigger>
        <SelectContent class="border-white/10 bg-slate-950 text-slate-100">
          <SelectItem value="all">{{ runtime.t('remoteTaskManagement.instances.statusAll', 'All Status') }}</SelectItem>
          <SelectItem value="active">{{ runtime.t('remoteTaskManagement.instances.statusActive', 'Active') }}</SelectItem>
          <SelectItem value="pending_review">{{ runtime.t('remoteTaskManagement.instances.statusPending', 'Pending Review') }}</SelectItem>
          <SelectItem value="rejected">{{ runtime.t('remoteTaskManagement.instances.statusRejected', 'Rejected') }}</SelectItem>
          <SelectItem value="disabled">{{ runtime.t('remoteTaskManagement.instances.statusDisabled', 'Disabled') }}</SelectItem>
        </SelectContent>
      </Select>
      <Select v-model="visibility">
        <SelectTrigger data-test-id="remote-task-management.instances.visibility" class="w-[140px] rounded-xl border-white/12 bg-white/[0.04] text-slate-100 hover:border-white/20">
          <SelectValue :placeholder="runtime.t('remoteTaskManagement.instances.visibilityAll', 'All Visibility')" />
        </SelectTrigger>
        <SelectContent class="border-white/10 bg-slate-950 text-slate-100">
          <SelectItem value="all">{{ runtime.t('remoteTaskManagement.instances.visibilityAll', 'All Visibility') }}</SelectItem>
          <SelectItem value="public">{{ runtime.t('remoteTaskManagement.instances.visibilityPublic', 'Public') }}</SelectItem>
          <SelectItem value="private">{{ runtime.t('remoteTaskManagement.instances.visibilityPrivate', 'Private') }}</SelectItem>
        </SelectContent>
      </Select>
    </template>

    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskManagement.instances.loading', 'Loading instances...')" />
    <BundleState v-else-if="error" variant="error" :message="error" :action-label="runtime.t('remoteTaskManagement.instances.refresh', 'Refresh')" @action="load" />
    <div v-else-if="!filteredInstances.length" class="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-6 py-10 text-center">
      <div class="text-lg font-semibold text-white">{{ runtime.t('remoteTaskManagement.instances.empty', 'No instances found') }}</div>
    </div>
    <div v-else class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <Table data-test-id="remote-task-management.instances.table">
        <TableHeader class="bg-white/[0.02]">
          <TableRow class="border-white/10 hover:bg-transparent">
            <TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.instances.instance', 'Instance') }}</TableHead>
            <TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.instances.package', 'Package') }}</TableHead>
            <TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.instances.owner', 'Owner') }}</TableHead>
            <TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.instances.visibility', 'Visibility') }}</TableHead>
            <TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.instances.status', 'Status') }}</TableHead>
            <TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.instances.version', 'Version') }}</TableHead>
            <TableHead class="text-slate-400">{{ runtime.t('remoteTaskManagement.instances.actions', 'Actions') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
          v-for="instance in filteredInstances"
          :key="instance.id"
          :data-test-id="`remote-task-management.instances.row.${instance.id}`"
          class="cursor-pointer border-white/10 transition hover:bg-white/[0.04]"
        >
            <TableCell @click="detail(instance.id)">
              <div class="font-medium text-white">{{ instance.name || instance.id }}</div>
              <div class="text-sm leading-6 text-slate-400">{{ instance.instance_description || '-' }}</div>
            </TableCell>
            <TableCell class="text-slate-300">{{ instance.pkgName || instance.pkg_id || '-' }}</TableCell>
            <TableCell class="text-slate-300">{{ ownerLabelOf(instance) }}</TableCell>
            <TableCell class="text-slate-300">{{ instance.visibility || '-' }}</TableCell>
            <TableCell>
              <span class="rounded-full border px-3 py-1 text-xs font-medium" :class="statusClassOf(instance)">
                {{ instance.status || 'unknown' }}
              </span>
            </TableCell>
            <TableCell class="text-slate-300">{{ instance.activeVersion || '-' }}</TableCell>
            <TableCell>
              <Button variant="outline" size="sm" @click="detail(instance.id)">
                {{ runtime.t('remoteTaskManagement.instances.details', 'Details') }}
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </BundlePage>
</template>
