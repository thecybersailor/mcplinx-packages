<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundleState from '../components/BundleState.vue'
import ConnectorGettingStarted from '../components/ConnectorGettingStarted.vue'
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

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="remote-task-management.packages.page"
    title="My Connector Packages"
    :description="`Scope: ${runtime.scope}`"
    borderless
  >
    <template #actions>
      <button class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]" @click="load">Refresh</button>
      <select
        v-model="statusFilter"
        data-test-id="remote-task-management.packages.status"
        class="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 outline-none transition hover:border-white/20"
        @change="load"
      >
        <option class="bg-slate-950 text-slate-100" value="all">All Status</option>
        <option class="bg-slate-950 text-slate-100" value="active">Active</option>
        <option class="bg-slate-950 text-slate-100" value="disabled">Disabled</option>
      </select>
    </template>

    <BundleState v-if="loading" variant="loading" message="Loading packages..." />
    <BundleState v-else-if="error" variant="error" :message="error" action-label="Refresh" @action="load" />
    <ConnectorGettingStarted data-test-id="remote-task-management.packages.cli-hint" />
    <div v-if="!loading && !error && !packages.length" class="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-6 py-10 text-center">
      <div class="text-lg font-semibold text-white">You haven&apos;t published any connectors yet.</div>
      <div class="mt-2 text-sm text-slate-400">Use the CLI commands above to publish your first connector.</div>
    </div>
    <div v-else-if="!loading && !error" class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <table data-test-id="remote-task-management.packages.table" class="min-w-full bg-transparent">
        <thead class="bg-white/[0.02] text-left text-sm text-slate-400">
          <tr>
            <th class="px-4 py-3 font-medium">Application</th>
            <th class="px-4 py-3 font-medium">Version</th>
            <th class="px-4 py-3 font-medium">Tools</th>
            <th class="px-4 py-3 font-medium">Last Updated</th>
            <th class="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
          v-for="pkg in packages"
          :key="pkg.hashID || pkg.id"
          :data-test-id="`remote-task-management.packages.row.${pkg.hashID || pkg.id}`"
          class="cursor-pointer border-t border-white/10 transition hover:bg-white/[0.04]"
        >
            <td class="px-4 py-4" @click="openDetail(pkg.hashID || String(pkg.id || ''))">
              <div class="font-medium text-white">{{ pkg.name || pkg.hashID || pkg.id }}</div>
              <div class="text-sm leading-6 text-slate-400">{{ pkg.package_description || '-' }}</div>
            </td>
            <td class="px-4 py-4">
              <span class="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-100">
                {{ latestVersionOf(pkg) }}
              </span>
            </td>
            <td class="px-4 py-4 text-slate-300">{{ latestToolCountOf(pkg) }}</td>
            <td class="px-4 py-4 text-slate-300">{{ pkg.updatedAt || pkg.createdAt || '-' }}</td>
            <td class="px-4 py-4">
              <button class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]" @click="openDetail(pkg.hashID || String(pkg.id || ''))">Manage</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </BundlePage>
</template>
