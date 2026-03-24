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
const pkg = ref<Awaited<ReturnType<typeof runtime.facade.getPackage>> | null>(null)
const versions = ref<Awaited<ReturnType<typeof runtime.facade.listPackageVersions>>>([])
const instances = ref<Awaited<ReturnType<typeof runtime.facade.listPackageInstances>>>([])
const pkgId = computed(() => String(route.params.pkgId ?? ''))

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

onMounted(load)
</script>

<template>
  <BundlePage
    :data-test-id="loading ? undefined : 'remote-task-management.package-detail.page'"
    :title="pkg?.name || pkg?.hashID || String(pkg?.id || 'Package detail')"
    :description="pkg?.package_description || ''"
  >
    <template #actions>
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="router.back()">Back</button>
    </template>

    <BundleState v-if="loading" variant="loading" message="Loading..." />
    <BundleState v-else-if="error" variant="error" :message="error" />
    <div v-else-if="pkg" class="space-y-4">
      <BundlePanel>
        <h2 class="mb-3 text-base font-semibold text-slate-950">Package Statistics</h2>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Total Instances</div>
            <div class="mt-2 text-2xl font-semibold text-slate-950">{{ pkg.totalInstances ?? 0 }}</div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Active Instances</div>
            <div class="mt-2 text-2xl font-semibold text-slate-950">{{ pkg.activeInstances ?? 0 }}</div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Public Instances</div>
            <div class="mt-2 text-2xl font-semibold text-slate-950">{{ pkg.publicInstances ?? 0 }}</div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Pending Reviews</div>
            <div class="mt-2 text-2xl font-semibold text-slate-950">{{ pkg.pendingReviews ?? 0 }}</div>
          </div>
        </div>
      </BundlePanel>

      <BundlePanel v-if="runtime.sharedConnectionRoutePrefix">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-slate-950">Shared Connections</h2>
            <p class="mt-1 text-sm text-slate-500">View the shared connections for this connector.</p>
          </div>
          <button
            data-test-id="remote-task-management.package-detail.shared-connections"
            class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            @click="openSharedConnections"
          >
            Open
          </button>
        </div>
      </BundlePanel>

      <BundlePanel>
        <h2 class="mb-3 text-base font-semibold text-slate-950">Versions</h2>
        <div class="overflow-hidden rounded-2xl border border-slate-200">
          <table class="min-w-full bg-white">
            <thead class="bg-slate-50 text-left text-sm text-slate-500"><tr><th class="px-4 py-3 font-medium">Version</th><th class="px-4 py-3 font-medium">Tools</th><th class="px-4 py-3 font-medium">Created</th></tr></thead>
            <tbody>
              <tr v-for="version in versions" :key="version.id || version.version" class="border-t border-slate-200">
                <td class="px-4 py-4 text-slate-800">{{ version.version || '-' }}</td>
                <td class="px-4 py-4 text-slate-600">{{ version.toolCount || 0 }}</td>
                <td class="px-4 py-4 text-slate-600">{{ version.createdAt || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </BundlePanel>

      <BundlePanel>
        <h2 class="mb-3 text-base font-semibold text-slate-950">Instances</h2>
        <div class="overflow-hidden rounded-2xl border border-slate-200">
          <table class="min-w-full bg-white">
            <thead class="bg-slate-50 text-left text-sm text-slate-500"><tr><th class="px-4 py-3 font-medium">Name</th><th class="px-4 py-3 font-medium">Status</th><th class="px-4 py-3 font-medium">Version</th></tr></thead>
            <tbody>
              <tr v-for="instance in instances" :key="instance.id" class="border-t border-slate-200">
                <td class="px-4 py-4 text-slate-800">{{ instance.name || instance.id }}</td>
                <td class="px-4 py-4 text-slate-600">{{ instance.status || '-' }}</td>
                <td class="px-4 py-4 text-slate-600">{{ instance.activeVersion || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </BundlePanel>
    </div>
  </BundlePage>
</template>
