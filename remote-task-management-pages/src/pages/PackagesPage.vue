<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const packages = ref<Awaited<ReturnType<typeof runtime.facade.listPackages>>>([])
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

const latestVersionOf = (pkg: (typeof packages.value)[number]) => {
  if (!pkg.versions?.length) return '-'
  return [...pkg.versions].sort((left, right) => {
    return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
  })[0]?.version || '-'
}

const latestToolCountOf = (pkg: (typeof packages.value)[number]) => {
  if (!pkg.versions?.length) return 0
  return [...pkg.versions].sort((left, right) => {
    return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
  })[0]?.toolCount || 0
}

const instanceCountOf = (pkg: (typeof packages.value)[number]) => {
  return pkg.totalInstances ?? 0
}

const rowKeyOf = (pkg: (typeof packages.value)[number]) => {
  return String(pkg.id || '')
}

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="remote-task-management.packages.page"
    title="My Connector Packages"
    :description="`Scope: ${runtime.scope}`"
    borderless
  >
    <div
      data-test-id="remote-task-admin.packages.page"
      class="absolute left-0 top-0 h-px w-px opacity-0 pointer-events-none"
      aria-hidden="true"
    >
      My Connector Packages
    </div>
    <template #actions>
      <button class="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted" @click="load">Refresh</button>
      <select
        v-model="statusFilter"
        data-test-id="remote-task-management.packages.status"
        class="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground outline-none transition hover:bg-muted"
        @change="load"
      >
        <option class="bg-background text-foreground" value="all">All Status</option>
        <option class="bg-background text-foreground" value="active">Active</option>
        <option class="bg-background text-foreground" value="disabled">Disabled</option>
      </select>
    </template>

    <BundleState v-if="loading" variant="loading" message="Loading packages..." />
    <BundleState v-else-if="error" variant="error" :message="error" action-label="Refresh" @action="load" />
    <div v-if="!loading && !error && !packages.length" class="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
      <div class="text-lg font-semibold text-foreground">You haven&apos;t published any connectors yet.</div>
      <div class="mt-2 text-sm text-muted-foreground">Use the CLI commands above to publish your first connector.</div>
    </div>
    <div v-else-if="!loading && !error" class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <table data-test-id="remote-task-management.packages.table" class="min-w-full bg-transparent">
        <thead class="bg-muted/40 text-left text-sm text-muted-foreground">
          <tr>
            <th class="px-4 py-3 font-medium">Application</th>
            <th class="px-4 py-3 font-medium">Version</th>
            <th class="px-4 py-3 font-medium">Tools</th>
            <th class="px-4 py-3 font-medium">Instances</th>
            <th class="px-4 py-3 font-medium">Last Updated</th>
            <th class="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
          v-for="pkg in packages"
          :key="pkg.id"
          :data-test-id="`remote-task-management.packages.row.${rowKeyOf(pkg)}`"
          class="cursor-pointer border-t border-border transition hover:bg-muted/30"
        >
            <td class="px-4 py-4" @click="openDetail(String(pkg.id || ''))">
              <div class="font-medium text-foreground">{{ pkg.name || pkg.id }}</div>
              <div class="text-sm leading-6 text-muted-foreground">{{ pkg.package_description || '-' }}</div>
            </td>
            <td class="px-4 py-4">
              <span class="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-700">
                {{ latestVersionOf(pkg) }}
              </span>
            </td>
            <td class="px-4 py-4 text-foreground">{{ latestToolCountOf(pkg) }}</td>
            <td class="px-4 py-4 text-foreground">{{ instanceCountOf(pkg) }}</td>
            <td class="px-4 py-4 text-muted-foreground">{{ pkg.updatedAt || pkg.createdAt || '-' }}</td>
            <td class="px-4 py-4">
              <button
                :data-test-id="`remote-task-management.packages.row.${rowKeyOf(pkg)}.manage`"
                class="inline-flex items-center justify-center rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                @click="openDetail(String(pkg.id || ''))"
              >
                Manage
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </BundlePage>
</template>
