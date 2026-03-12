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
const packages = ref<Awaited<ReturnType<typeof runtime.facade.listPackages>>>([])
const cliHintOpen = ref(false)
const hostBaseUrl = 'http://localhost:7001'

function nameOf(suffix: string) {
  return `${runtime.routePrefix}-${suffix}`
}

const teamId = computed(() => {
  const value = route.params.teamId
  return typeof value === 'string' ? value.trim() : ''
})

const publishCommand = computed(() => {
  const segments = ['bw-linktool', 'publish', `--scope ${runtime.scope}`]
  if (runtime.scope === 'team' && teamId.value) segments.push(`--team-id ${teamId.value}`)
  segments.push(`--base-url ${hostBaseUrl}`)
  segments.push(`--payload '{\"name\":\"your_connector\"}'`)
  return segments.join(' ')
})

const deployCommand = computed(() => {
  const segments = ['bw-linktool', 'deploy', `--scope ${runtime.scope}`]
  if (runtime.scope === 'team' && teamId.value) segments.push(`--team-id ${teamId.value}`)
  segments.push(`--base-url ${hostBaseUrl}`)
  segments.push(`--payload '{\"name\":\"your_connector\",\"version\":\"latest\"}'`)
  return segments.join(' ')
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    packages.value = await runtime.facade.listPackages()
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

function toggleCliHint() {
  cliHintOpen.value = !cliHintOpen.value
}

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="remote-task-management.packages.page"
    title="Connector Packages"
    :description="`Scope: ${runtime.scope}`"
    borderless
  >
    <template #actions>
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="load">Refresh</button>
      <button class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" @click="router.push({ name: nameOf('publish') })">Publish</button>
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="router.push({ name: nameOf('deploy') })">Deploy</button>
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="router.push({ name: nameOf('config') })">Config</button>
      <button
        data-test-id="remote-task-management.packages.cli-hint-toggle"
        class="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-950 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100 dark:hover:bg-emerald-900/60"
        @click="toggleCliHint"
      >
        {{ cliHintOpen ? 'Hide CLI Hint' : 'CLI Hint' }}
      </button>
    </template>

    <BundlePanel
      v-if="cliHintOpen"
      data-test-id="remote-task-management.packages.cli-hint"
      class="space-y-4"
    >
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-slate-950">CLI Quickstart</h2>
        <p class="text-sm leading-6 text-slate-600">
          Use <code class="rounded bg-white px-1.5 py-0.5 text-[13px] text-slate-900">bw-linktool</code> to publish or deploy a connector directly into the current
          <span class="font-medium text-slate-900">{{ runtime.scope }}</span> scope.
        </p>
      </div>

      <div class="grid gap-3 lg:grid-cols-2">
        <div class="space-y-2">
          <div class="text-sm font-medium text-slate-700">Publish to current scope</div>
          <pre class="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 text-xs leading-6 text-slate-900"><code>{{ publishCommand }}</code></pre>
        </div>
        <div class="space-y-2">
          <div class="text-sm font-medium text-slate-700">Deploy inside current scope</div>
          <pre class="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 text-xs leading-6 text-slate-900"><code>{{ deployCommand }}</code></pre>
        </div>
      </div>

      <p class="text-xs leading-5 text-slate-500">
        Local dev API base is <code class="rounded bg-white px-1.5 py-0.5 text-[12px] text-slate-900">{{ hostBaseUrl }}</code>.
        Team scope commands include the current <code class="rounded bg-white px-1.5 py-0.5 text-[12px] text-slate-900">teamId</code> automatically.
      </p>
    </BundlePanel>

    <BundleState v-if="loading" variant="loading" message="Loading..." />
    <BundleState v-else-if="error" variant="error" :message="error" action-label="Refresh" @action="load" />
    <BundleState v-else-if="!packages.length" variant="empty" message="No packages." />
    <div v-else class="overflow-hidden rounded-2xl border border-slate-200">
      <table data-test-id="remote-task-management.packages.table" class="min-w-full bg-white">
        <thead class="bg-slate-50 text-left text-sm text-slate-500">
          <tr>
            <th class="px-4 py-3 font-medium">Package</th>
            <th class="px-4 py-3 font-medium">Author</th>
            <th class="px-4 py-3 font-medium">Versions</th>
            <th class="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pkg in packages" :key="pkg.hashID || pkg.id" :data-test-id="`remote-task-management.packages.row.${pkg.hashID || pkg.id}`" class="border-t border-slate-200">
            <td class="px-4 py-4">
              <div class="font-medium text-slate-950">{{ pkg.name || pkg.hashID || pkg.id }}</div>
              <div class="text-sm leading-6 text-slate-500">{{ pkg.package_description || '-' }}</div>
            </td>
            <td class="px-4 py-4 text-slate-600">{{ pkg.author?.email || '-' }}</td>
            <td class="px-4 py-4 text-slate-600">{{ pkg.versions?.length || 0 }}</td>
            <td class="px-4 py-4">
              <div class="flex flex-wrap gap-2">
                <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="openDetail(pkg.hashID || String(pkg.id || ''))">Details</button>
                <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="router.push({ name: nameOf('pending-instances') })">Pending</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </BundlePage>
</template>
