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
      pkg_id: String(pkg.value.id || ''),
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
    :title="pkg?.name || String(pkg?.id || 'My Connector Detail')"
    :description="pkg ? `Package: ${pkg.id}` : ''"
  >
    <template #actions>
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="router.back()">Back</button>
    </template>

    <BundleState v-if="loading" variant="loading" message="Loading..." />
    <BundleState v-else-if="error" variant="error" :message="error" />
    <div v-else-if="pkg" class="space-y-4">
      <div class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div class="space-y-4">
          <BundlePanel>
            <div class="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 class="text-base font-semibold text-white">Deployment</h2>
                <p class="mt-1 text-sm text-slate-400">Create and manage deployable instances for this connector package.</p>
              </div>
              <button
                v-if="runtime.facade.createInstance"
                data-test-id="remote-task-management.package-detail.create-instance"
                class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]"
                @click="openCreateInstanceDrawer"
              >
                + Create Instance
              </button>
            </div>

            <div v-if="instances.length" class="space-y-3">
              <button
                v-for="instance in instances"
                :key="instance.id"
                type="button"
                class="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-cyan-400/30 hover:bg-white/[0.06]"
                @click="openInstanceDetail(instance.id)"
              >
                <div class="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <div class="text-sm font-semibold text-white">{{ instance.name || instance.id }}</div>
                    <div class="mt-1 text-xs text-slate-400">ID: {{ instance.id }}</div>
                  </div>
                  <div class="flex flex-wrap gap-2 text-xs">
                    <span class="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-slate-200">{{ instance.visibility || 'private' }}</span>
                    <span class="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-slate-200">{{ instance.status || '-' }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between text-sm text-slate-400">
                  <span>Version: {{ instance.activeVersion || '-' }}</span>
                  <span v-if="instance.status === 'pending_review'" class="text-amber-300">Awaiting admin approval</span>
                </div>
              </button>
            </div>
            <div v-else class="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-8 text-center">
              <div class="text-sm font-medium text-white">No instances created yet</div>
              <div class="mt-2 text-xs text-slate-400">Run <code class="rounded bg-slate-950 px-1.5 py-0.5 text-slate-100">syntool deploy</code> to get started.</div>
            </div>
          </BundlePanel>

          <BundlePanel>
            <h2 class="mb-3 text-base font-semibold text-white">Available Tools - Latest Version</h2>
            <div v-if="versions[0]" class="space-y-2">
              <div class="text-sm text-slate-300">Version {{ versions[0].version || '-' }}</div>
              <div class="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-slate-400">
                {{ versions[0].toolCount || 0 }} tool<span v-if="(versions[0].toolCount || 0) !== 1">s</span> are available in the latest package version.
              </div>
            </div>
            <p v-else class="text-sm text-slate-400">No tools available yet.</p>
          </BundlePanel>

          <BundlePanel>
            <h2 class="mb-3 text-base font-semibold text-white">All Versions ({{ versions.length }})</h2>
            <div v-if="versions.length" class="overflow-hidden rounded-2xl border border-white/10">
              <table class="min-w-full bg-transparent">
                <thead class="bg-white/[0.02] text-left text-sm text-slate-400"><tr><th class="px-4 py-3 font-medium">Version</th><th class="px-4 py-3 font-medium">Tools</th><th class="px-4 py-3 font-medium">Created</th></tr></thead>
                <tbody>
                  <tr v-for="version in versions" :key="version.id || version.version" class="border-t border-white/10">
                    <td class="px-4 py-4 text-slate-100">{{ version.version || '-' }}</td>
                    <td class="px-4 py-4 text-slate-300">{{ version.toolCount || 0 }}</td>
                    <td class="px-4 py-4 text-slate-300">{{ version.createdAt || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-8 text-center text-sm text-slate-400">
              Publish or deploy with the CLI to add the first version for this connector package.
            </div>
          </BundlePanel>
        </div>

        <div class="space-y-4">
          <BundlePanel>
            <h2 class="mb-3 text-base font-semibold text-white">Basic Info</h2>
            <dl class="grid gap-3">
              <div>
                <dt class="text-xs uppercase tracking-wide text-slate-500">Name</dt>
                <dd class="mt-1 text-sm text-slate-100">{{ pkg.name || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-wide text-slate-500">Package ID</dt>
                <dd class="mt-1 break-all text-sm text-slate-300">{{ pkg.id || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-wide text-slate-500">Description</dt>
                <dd class="mt-1 text-sm text-slate-300">{{ pkg.package_description || '-' }}</dd>
              </div>
            </dl>
          </BundlePanel>

          <BundlePanel>
            <h2 class="mb-3 text-base font-semibold text-white">Package Statistics</h2>
            <div class="grid gap-3">
              <div class="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
                <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Total Instances</div>
                <div class="mt-2 text-2xl font-semibold text-white">{{ pkg.totalInstances ?? 0 }}</div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
                <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Active Instances</div>
                <div class="mt-2 text-2xl font-semibold text-white">{{ pkg.activeInstances ?? 0 }}</div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
                <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Public Instances</div>
                <div class="mt-2 text-2xl font-semibold text-white">{{ pkg.publicInstances ?? 0 }}</div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
                <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Pending Reviews</div>
                <div class="mt-2 text-2xl font-semibold text-white">{{ pkg.pendingReviews ?? 0 }}</div>
              </div>
            </div>
          </BundlePanel>
        </div>
      </div>

      <div
        v-if="showCreateInstanceDrawer"
        class="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm"
        @click.self="showCreateInstanceDrawer = false"
      >
        <div class="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950 px-6 py-6 text-slate-100 shadow-2xl">
          <div class="mb-6 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-white">Create New Instance</h2>
              <p class="mt-1 text-sm text-slate-400">Create a deployable connector instance from this package.</p>
            </div>
            <button class="rounded-xl border border-white/12 px-3 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.04]" @click="showCreateInstanceDrawer = false">Close</button>
          </div>

          <div class="space-y-4">
            <label class="grid gap-2">
              <span class="text-sm font-medium text-slate-200">Name</span>
              <input v-model="newInstanceForm.name" data-test-id="remote-task-management.package-detail.create-instance.name" class="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-100 outline-none" placeholder="My Connector Instance" />
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-medium text-slate-200">Description</span>
              <textarea v-model="newInstanceForm.description" data-test-id="remote-task-management.package-detail.create-instance.description" class="min-h-24 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-100 outline-none" placeholder="Description for this instance" />
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-medium text-slate-200">Version</span>
              <select v-model="newInstanceForm.version" data-test-id="remote-task-management.package-detail.create-instance.version" class="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-100 outline-none">
                <option class="bg-slate-950 text-slate-100" value="">Select a version</option>
                <option v-for="version in versions" :key="version.version" class="bg-slate-950 text-slate-100" :value="version.version">
                  {{ version.version }}
                </option>
              </select>
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-medium text-slate-200">Visibility</span>
              <select v-model="newInstanceForm.visibility" data-test-id="remote-task-management.package-detail.create-instance.visibility" class="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-100 outline-none">
                <option class="bg-slate-950 text-slate-100" value="private">Private</option>
                <option class="bg-slate-950 text-slate-100" value="public">Public</option>
              </select>
            </label>

            <p v-if="createInstanceError" class="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{{ createInstanceError }}</p>
          </div>

          <div class="mt-6 flex items-center gap-3">
            <button
              data-test-id="remote-task-management.package-detail.create-instance.submit"
              class="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="creatingInstance || !newInstanceForm.version"
              @click="createInstance"
            >
              {{ creatingInstance ? 'Creating...' : 'Create Instance' }}
            </button>
            <button class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]" @click="showCreateInstanceDrawer = false">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </BundlePage>
</template>
