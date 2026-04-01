<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@mcplinx/ui-vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import ConnectorGettingStarted from '../components/ConnectorGettingStarted.vue'
import { remoteTaskManagementPageTestId, useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const pageTestId = remoteTaskManagementPageTestId(runtime, 'packages')
const router = useRouter()
const loading = ref(true)
const error = ref('')
type RemotePackage = Awaited<ReturnType<typeof runtime.facade.listPackages>>[number]
const packages = ref<RemotePackage[]>([])
const statusFilter = ref<'all' | 'active' | 'disabled'>('all')

function nameOf(suffix: string) {
  return `${runtime.routePrefix}-${suffix}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [packageData, pendingInstances] = await Promise.all([
      runtime.facade.listPackages(statusFilter.value === 'all' ? undefined : { status: statusFilter.value }),
      runtime.facade.listInstances({ status: 'pending_review' }),
    ])
    packages.value = packageData
    void pendingInstances
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
    packages.value = []
  } finally {
    loading.value = false
  }
}

function openDetail(id?: string) {
  if (!id) return
  void router.push({ name: nameOf('package-detail'), params: { pkgId: id } })
}

const latestVersionOf = (pkg: RemotePackage) => {
  if (!pkg.versions?.length) return '-'
  return [...pkg.versions].sort((left, right) => {
    return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
  })[0]?.version || '-'
}

const latestToolCountOf = (pkg: RemotePackage) => {
  if (!pkg.versions?.length) return 0
  return [...pkg.versions].sort((left, right) => {
    return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
  })[0]?.toolCount || 0
}

onMounted(load)
</script>

<template>
  <BundlePage
    :data-test-id="pageTestId"
    :title="runtime.t('remoteTaskManagement.packages.title', 'My Connector Packages')"
    :description="runtime.t('remoteTaskManagement.packages.scope', 'Scope: {scope}', { scope: runtime.scope })"
    borderless
  >
    <template #actions>
      <Button variant="outline" @click="load">{{ runtime.t('remoteTaskManagement.packages.refresh', 'Refresh') }}</Button>
      <Select v-model="statusFilter" @update:modelValue="load">
        <SelectTrigger data-test-id="remote-task-management.packages.status" class="w-[140px] rounded-xl border-input bg-background text-foreground hover:bg-accent/50">
          <SelectValue :placeholder="runtime.t('remoteTaskManagement.packages.statusAll', 'All Status')" />
        </SelectTrigger>
        <SelectContent class="border-border bg-popover text-popover-foreground">
          <SelectItem value="all">{{ runtime.t('remoteTaskManagement.packages.statusAll', 'All Status') }}</SelectItem>
          <SelectItem value="active">{{ runtime.t('remoteTaskManagement.packages.statusActive', 'Active') }}</SelectItem>
          <SelectItem value="disabled">{{ runtime.t('remoteTaskManagement.packages.statusDisabled', 'Disabled') }}</SelectItem>
        </SelectContent>
      </Select>
    </template>

    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskManagement.packages.loading', 'Loading packages...')" />
    <BundleState v-else-if="error" variant="error" :message="error" :action-label="runtime.t('remoteTaskManagement.packages.refresh', 'Refresh')" @action="load" />
    <ConnectorGettingStarted data-test-id="remote-task-management.packages.cli-hint" />
    <BundlePanel v-if="!loading && !error && !packages.length" plain>
      <div class="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
        <div class="text-lg font-semibold text-foreground">{{ runtime.t('remoteTaskManagement.packages.emptyTitle', 'You haven\'t published any connectors yet.') }}</div>
        <div class="mt-2 text-sm text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.emptySub', 'Use the CLI commands above to publish your first connector.') }}</div>
      </div>
    </BundlePanel>
    <BundlePanel v-else-if="!loading && !error" plain>
      <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <Table data-test-id="remote-task-management.packages.table">
          <TableHeader class="bg-muted/30">
            <TableRow class="border-border hover:bg-transparent">
              <TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.application', 'Application') }}</TableHead>
              <TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.version', 'Version') }}</TableHead>
              <TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.tools', 'Tools') }}</TableHead>
              <TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.lastUpdated', 'Last Updated') }}</TableHead>
              <TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.actions', 'Actions') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="pkg in packages"
              :key="pkg.hashID || pkg.id"
              :data-test-id="`remote-task-management.packages.row.${pkg.hashID || pkg.id}`"
              class="cursor-pointer border-border transition hover:bg-muted/50"
            >
              <TableCell @click="openDetail(pkg.hashID || String(pkg.id || ''))">
                <div class="font-medium text-foreground">{{ pkg.name || pkg.hashID || pkg.id }}</div>
                <div class="text-sm leading-6 text-muted-foreground">{{ pkg.package_description || '-' }}</div>
              </TableCell>
              <TableCell>
                <span
                  class="rounded-full border border-cyan-600/25 bg-cyan-100/90 px-3 py-1 text-xs font-medium text-cyan-900 dark:border-cyan-400/25 dark:bg-cyan-500/10 dark:text-cyan-100"
                >
                  {{ latestVersionOf(pkg) }}
                </span>
              </TableCell>
              <TableCell class="text-foreground">{{ latestToolCountOf(pkg) }}</TableCell>
              <TableCell class="text-muted-foreground">{{ pkg.updatedAt || pkg.createdAt || '-' }}</TableCell>
              <TableCell>
                <Button
                  :data-test-id="`remote-task-management.packages.row.${pkg.hashID || pkg.id}.manage`"
                  variant="outline"
                  size="sm"
                  @click="openDetail(pkg.hashID || String(pkg.id || ''))"
                >
                  {{ runtime.t('remoteTaskManagement.packages.manage', 'Manage') }}
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </BundlePanel>
  </BundlePage>
</template>
