<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@mcplinx/ui-vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const pkg = ref<Awaited<ReturnType<typeof runtime.facade.getPackage>> | null>(null)
const versions = ref<Awaited<ReturnType<typeof runtime.facade.listPackageVersions>>>([])
const instances = ref<Awaited<ReturnType<typeof runtime.facade.listPackageInstances>>>([])
const creatingInstance = ref(false)
const showCreateInstanceDrawer = ref(false)
const createInstanceError = ref('')
const pkgId = computed(() => String(route.params.pkgId ?? ''))
const newInstanceForm = ref({
  name: '',
  description: '',
  version: '',
  visibility: 'private',
})

function openInstanceDetail(id?: string | number) {
  if (!id) return
  void router.push({
    name: `${runtime.routePrefix}-instance-detail`,
    params: { instanceId: String(id) },
  })
}

function openSharedConnections() {
  if (!runtime.sharedConnectionRoutePrefix || !pkg.value) return
  const connectorId = String(pkg.value.hashID || pkg.value.id || '')
  if (!connectorId) return
  router.push({
    name: `${runtime.sharedConnectionRoutePrefix}-connections`,
    query: { connector_id: connectorId },
  })
}

async function load() {
  if (!pkgId.value) return
  loading.value = true
  error.value = ''
  try {
    const [pkgData, versionData, instanceData] = await Promise.all([
      runtime.facade.getPackage(pkgId.value),
      runtime.facade.listPackageVersions(pkgId.value),
      runtime.facade.listPackageInstances(pkgId.value),
    ])
    pkg.value = pkgData
    versions.value = versionData
    instances.value = instanceData
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
    pkg.value = null
    versions.value = []
    instances.value = []
  } finally {
    loading.value = false
  }
}

function resetCreateInstanceForm() {
  newInstanceForm.value = {
    name: '',
    description: '',
    version: versions.value[0]?.version || '',
    visibility: 'private',
  }
  createInstanceError.value = ''
}

function openCreateInstanceDrawer() {
  resetCreateInstanceForm()
  showCreateInstanceDrawer.value = true
}

async function createInstance() {
  if (!runtime.facade.createInstance || !pkg.value || !newInstanceForm.value.version) return
  creatingInstance.value = true
  createInstanceError.value = ''
  try {
    const created = await runtime.facade.createInstance({
      pkg_id: String(pkg.value.hashID || pkg.value.id || ''),
      name: newInstanceForm.value.name || pkg.value.name || 'New Connector Instance',
      description: newInstanceForm.value.description || undefined,
      active_version: newInstanceForm.value.version,
      visibility: newInstanceForm.value.visibility,
    })
    showCreateInstanceDrawer.value = false
    await load()
    openInstanceDetail(created.id)
  } catch (err) {
    createInstanceError.value = err instanceof Error ? err.message : 'Failed to create instance'
  } finally {
    creatingInstance.value = false
  }
}

onMounted(load)
</script>

<template>
  <BundlePage
    :data-test-id="loading ? undefined : 'remote-task-management.package-detail.page'"
    :title="pkg?.name || pkg?.hashID || String(pkg?.id || runtime.t('remoteTaskManagement.packages.detailTitle', 'My Connector Detail'))"
    :description="pkg ? runtime.t('remoteTaskManagement.packages.idLabel', 'Package: {id}', { id: pkg.name || pkg.hashID || pkg.id }) : ''"
  >
    <template #actions>
      <Button variant="outline" @click="router.back()">{{ runtime.t('remoteTaskManagement.common.back', 'Back') }}</Button>
    </template>

    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskManagement.common.loading', 'Loading...')" />
    <BundleState v-else-if="error" variant="error" :message="error" />
    <div v-else-if="pkg" class="space-y-6">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div class="space-y-6">
          <BundlePanel>
            <div class="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 class="text-base font-semibold text-foreground">{{ runtime.t('remoteTaskManagement.packages.deployment', 'Deployment') }}</h2>
                <p class="mt-1 text-sm text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.deploymentDesc', 'Create and manage deployable instances for this connector package.') }}</p>
              </div>
              <Button
                v-if="runtime.facade.createInstance"
                data-test-id="remote-task-management.package-detail.create-instance"
                variant="outline"
                @click="openCreateInstanceDrawer"
              >
                + {{ runtime.t('remoteTaskManagement.packages.createInstance', 'Create Instance') }}
              </Button>
            </div>

            <div
              v-if="instances.length"
              data-test-id="remote-task-management.package-detail.instances"
              class="space-y-3"
            >
              <div
                v-for="instance in instances"
                :key="instance.id"
                :data-test-id="`remote-task-management.package-detail.instances.row.${instance.id}`"
              >
                <button
                  :data-test-id="`remote-task-management.package-detail.instances.row.${instance.id}.detail`"
                  type="button"
                  class="w-full rounded-2xl border border-border bg-muted/50 p-4 text-left transition hover:border-primary/50 hover:bg-muted/60"
                  @click="openInstanceDetail(instance.id)"
                >
                  <div class="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <div class="text-sm font-semibold text-foreground">{{ instance.name || instance.id }}</div>
                      <div class="mt-1 text-xs text-muted-foreground">ID: {{ instance.id }}</div>
                    </div>
                    <div class="flex flex-wrap gap-2 text-xs">
                      <span class="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-muted-foreground">{{ instance.visibility || 'private' }}</span>
                      <span class="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-muted-foreground">{{ instance.status || '-' }}</span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{{ runtime.t('remoteTaskManagement.common.version', 'Version') }}: {{ instance.activeVersion || '-' }}</span>
                    <span v-if="instance.status === 'pending_review'" class="text-amber-700 dark:text-amber-300">{{ runtime.t('remoteTaskManagement.instances.awaitingApproval', 'Awaiting admin approval') }}</span>
                  </div>
                </button>
              </div>
            </div>
            <div v-else class="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
              <div class="text-sm font-medium text-foreground">{{ runtime.t('remoteTaskManagement.packages.noInstances', 'No instances created yet') }}</div>
              <div class="mt-2 text-xs text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.runDeploy', 'Run `syntool deploy` to get started.') }}</div>
            </div>
          </BundlePanel>

          <BundlePanel>
            <h2 class="mb-3 text-base font-semibold text-foreground">{{ runtime.t('remoteTaskManagement.packages.availableTools', 'Available Tools - Latest Version') }}</h2>
            <div v-if="versions[0]" class="space-y-2">
              <div class="text-sm text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.version', 'Version') }} {{ versions[0].version || '-' }}</div>
              <div class="rounded-2xl border border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
                {{ runtime.t('remoteTaskManagement.packages.toolsAvailable', '{count} tool(s) are available in the latest package version.', { count: versions[0].toolCount || 0 }) }}
              </div>
            </div>
            <p v-else class="text-sm text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.noTools', 'No tools available yet.') }}</p>
          </BundlePanel>

          <BundlePanel>
            <h2 class="mb-3 text-base font-semibold text-foreground">{{ runtime.t('remoteTaskManagement.packages.allVersions', 'All Versions ({count})', { count: versions.length }) }}</h2>
            <div v-if="versions.length" class="overflow-hidden rounded-2xl border border-border">
              <Table>
                <TableHeader class="bg-muted/30"><TableRow class="border-border hover:bg-transparent"><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.version', 'Version') }}</TableHead><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.tools', 'Tools') }}</TableHead><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.created', 'Created') }}</TableHead></TableRow></TableHeader>
                <TableBody>
                  <TableRow v-for="version in versions" :key="version.id || version.version" class="border-t border-border hover:bg-muted/25">
                    <TableCell class="text-foreground">{{ version.version || '-' }}</TableCell>
                    <TableCell class="text-muted-foreground">{{ version.toolCount || 0 }}</TableCell>
                    <TableCell class="text-muted-foreground">{{ version.createdAt || '-' }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div v-else class="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              {{ runtime.t('remoteTaskManagement.packages.publishOrDeploy', 'Publish or deploy with the CLI to add the first version for this connector package.') }}
            </div>
          </BundlePanel>
        </div>

        <div class="space-y-6">
          <BundlePanel>
            <h2 class="mb-3 text-base font-semibold text-foreground">{{ runtime.t('remoteTaskManagement.packages.basicInfo', 'Basic Info') }}</h2>
            <dl class="grid gap-3">
              <div>
                <dt class="text-xs uppercase tracking-wide text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.name', 'Name') }}</dt>
                <dd class="mt-1 text-sm text-foreground">{{ pkg.name || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-wide text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.packageId', 'Package ID') }}</dt>
                <dd class="mt-1 break-all text-sm text-muted-foreground">{{ pkg.hashID || pkg.id || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-wide text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.description', 'Description') }}</dt>
                <dd class="mt-1 text-sm text-muted-foreground">{{ pkg.package_description || '-' }}</dd>
              </div>
            </dl>
          </BundlePanel>

          <BundlePanel v-if="runtime.sharedConnectionRoutePrefix">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h2 class="text-base font-semibold text-foreground">{{ runtime.t('remoteTaskManagement.packages.sharedConnections', 'Shared Connections') }}</h2>
                <p class="mt-1 text-sm text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.sharedConnectionsDesc', 'View the shared connections for this connector.') }}</p>
              </div>
              <Button
                data-test-id="remote-task-management.package-detail.shared-connections"
                variant="outline"
                @click="openSharedConnections"
              >
                {{ runtime.t('remoteTaskManagement.common.open', 'Open') }}
              </Button>
            </div>
          </BundlePanel>

          <BundlePanel>
            <h2 class="mb-3 text-base font-semibold text-foreground">{{ runtime.t('remoteTaskManagement.packages.statistics', 'Package Statistics') }}</h2>
            <div class="grid gap-3">
              <div class="rounded-2xl border border-border bg-muted/30 px-4 py-4">
                <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.totalInstances', 'Total Instances') }}</div>
                <div class="mt-2 text-2xl font-semibold text-foreground">{{ pkg.totalInstances ?? 0 }}</div>
              </div>
              <div class="rounded-2xl border border-border bg-muted/30 px-4 py-4">
                <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.activeInstances', 'Active Instances') }}</div>
                <div class="mt-2 text-2xl font-semibold text-foreground">{{ pkg.activeInstances ?? 0 }}</div>
              </div>
              <div class="rounded-2xl border border-border bg-muted/30 px-4 py-4">
                <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.publicInstances', 'Public Instances') }}</div>
                <div class="mt-2 text-2xl font-semibold text-foreground">{{ pkg.publicInstances ?? 0 }}</div>
              </div>
              <div class="rounded-2xl border border-border bg-muted/30 px-4 py-4">
                <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ runtime.t('remoteTaskManagement.packages.pendingReviews', 'Pending Reviews') }}</div>
                <div class="mt-2 text-2xl font-semibold text-foreground">{{ pkg.pendingReviews ?? 0 }}</div>
              </div>
            </div>
          </BundlePanel>
        </div>
      </div>

      <Sheet :open="showCreateInstanceDrawer" @update:open="showCreateInstanceDrawer = $event">
        <SheetContent
          side="right"
          data-test-id="remote-task-management.package-detail.create-instance.sheet"
          class="h-full w-full max-w-xl overflow-y-auto border-border bg-card px-6 py-6 text-card-foreground sm:max-w-xl"
        >
          <SheetHeader class="mb-2 px-0 pr-10">
            <SheetTitle class="text-xl text-foreground">{{ runtime.t('remoteTaskManagement.packages.createNewInstance', 'Create New Instance') }}</SheetTitle>
            <SheetDescription class="mt-1 text-muted-foreground">
              {{ runtime.t('remoteTaskManagement.packages.createNewInstanceDesc', 'Create a deployable connector instance from this package.') }}
            </SheetDescription>
          </SheetHeader>

          <div class="space-y-4">
            <div class="grid gap-2">
              <Label for="create-instance-name" class="font-medium text-foreground">Name</Label>
              <Input
                id="create-instance-name"
                v-model="newInstanceForm.name"
                data-test-id="remote-task-management.package-detail.create-instance.name"
                class="border-input bg-background text-foreground"
                placeholder="My Connector Instance"
              />
            </div>

            <div class="grid gap-2">
              <Label for="create-instance-description" class="font-medium text-foreground">Description</Label>
              <Textarea
                id="create-instance-description"
                v-model="newInstanceForm.description"
                data-test-id="remote-task-management.package-detail.create-instance.description"
                class="min-h-24 border-input bg-background text-foreground"
                placeholder="Description for this instance"
              />
            </div>

            <div class="grid gap-2">
              <Label for="create-instance-version" class="font-medium text-foreground">Version</Label>
              <Select v-model="newInstanceForm.version">
                <SelectTrigger
                  id="create-instance-version"
                  data-test-id="remote-task-management.package-detail.create-instance.version.trigger"
                  class="w-full border-input bg-background text-foreground"
                >
                  <SelectValue placeholder="Select a version" />
                </SelectTrigger>
                <SelectContent class="border border-border bg-popover text-popover-foreground">
                  <SelectItem
                    v-for="version in versions"
                    :key="String(version.version || '')"
                    :value="String(version.version || '')"
                    :data-test-id="`remote-task-management.package-detail.create-instance.version.option.${String(version.version || '')}`"
                  >
                    {{ version.version }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid gap-2">
              <Label for="create-instance-visibility" class="font-medium text-foreground">Visibility</Label>
              <Select v-model="newInstanceForm.visibility">
                <SelectTrigger
                  id="create-instance-visibility"
                  data-test-id="remote-task-management.package-detail.create-instance.visibility.trigger"
                  class="w-full border-input bg-background text-foreground"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent class="border border-border bg-popover text-popover-foreground">
                  <SelectItem
                    value="private"
                    data-test-id="remote-task-management.package-detail.create-instance.visibility.option.private"
                  >
                    Private
                  </SelectItem>
                  <SelectItem
                    value="public"
                    data-test-id="remote-task-management.package-detail.create-instance.visibility.option.public"
                  >
                    Public
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p v-if="createInstanceError" class="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{{ createInstanceError }}</p>
          </div>

          <SheetFooter class="mt-6 flex flex-row flex-wrap items-center justify-end gap-2 border-t border-border px-0 pt-4">
            <Button variant="outline" class="border-border bg-background text-foreground" @click="showCreateInstanceDrawer = false">{{ runtime.t('remoteTaskManagement.common.cancel', 'Cancel') }}</Button>
            <Button
              data-test-id="remote-task-management.package-detail.create-instance.submit"
              :disabled="creatingInstance || !newInstanceForm.version"
              @click="createInstance"
            >
              {{ creatingInstance ? runtime.t('remoteTaskManagement.common.creating', 'Creating...') : runtime.t('remoteTaskManagement.packages.createInstance', 'Create Instance') }}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  </BundlePage>
</template>
