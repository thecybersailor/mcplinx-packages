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

function nameOf(suffix: string) {
  return `${runtime.routePrefix}-${suffix}`
}

const teamId = computed(() => {
  const value = route.params.teamId
  return typeof value === 'string' ? value.trim() : ''
})

const loginUrl = computed(() => {
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  if (!origin) return ''
  if (runtime.scope === 'team' && teamId.value) {
    return `${origin}/team/${teamId.value}/linktool-login`
  }
  if (runtime.scope === 'tenant') {
    return `${origin}/dashboard/linktool-login/tenant`
  }
  return `${origin}/linktool-login/platform`
})

const loginCommand = computed(() => {
  return `bw-linktool login --login-url ${loginUrl.value || '<login-url>'}`
})

const publishCommand = computed(() => {
  return `bw-linktool publish --payload '{\"name\":\"your_connector\"}'`
})

const deployCommand = computed(() => {
  return `bw-linktool deploy --payload '{\"name\":\"your_connector\",\"version\":\"latest\"}'`
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
      <button class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]" @click="load">Refresh</button>
      <button class="inline-flex items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/14 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/22" @click="router.push({ name: nameOf('publish') })">Publish</button>
      <button class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]" @click="router.push({ name: nameOf('deploy') })">Deploy</button>
      <button class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]" @click="router.push({ name: nameOf('config') })">Config</button>
      <button
        data-test-id="remote-task-management.packages.cli-hint-toggle"
        class="inline-flex items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/12 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-500/20"
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
        <h2 class="text-base font-semibold text-white">CLI Quickstart</h2>
        <p class="text-sm leading-6 text-slate-300">
          Start by logging <code class="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-[13px] text-white">bw-linktool</code> into the current
          <span class="font-medium text-cyan-100">{{ runtime.scope }}</span> scope. After that, publish and deploy commands reuse the stored profile automatically.
        </p>
      </div>

      <div class="grid gap-3 lg:grid-cols-3">
        <div class="space-y-2">
          <div class="text-sm font-medium text-slate-200">1. Login once</div>
          <pre class="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-3 text-xs leading-6 text-slate-100"><code>{{ loginCommand }}</code></pre>
        </div>
        <div class="space-y-2">
          <div class="text-sm font-medium text-slate-200">2. Publish into current scope</div>
          <pre class="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-3 text-xs leading-6 text-slate-100"><code>{{ publishCommand }}</code></pre>
        </div>
        <div class="space-y-2">
          <div class="text-sm font-medium text-slate-200">3. Deploy inside current scope</div>
          <pre class="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-3 text-xs leading-6 text-slate-100"><code>{{ deployCommand }}</code></pre>
        </div>
      </div>

      <p class="text-xs leading-5 text-slate-400">
        The login URL above is generated from the current page origin and route, so Portal/Admin hosts will each show their own correct entry address.
      </p>
    </BundlePanel>

    <BundleState v-if="loading" variant="loading" message="Loading..." />
    <BundleState v-else-if="error" variant="error" :message="error" action-label="Refresh" @action="load" />
    <BundleState v-else-if="!packages.length" variant="empty" message="No packages." />
    <div v-else class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <table data-test-id="remote-task-management.packages.table" class="min-w-full bg-transparent">
        <thead class="bg-white/[0.02] text-left text-sm text-slate-400">
          <tr>
            <th class="px-4 py-3 font-medium">Package</th>
            <th class="px-4 py-3 font-medium">Author</th>
            <th class="px-4 py-3 font-medium">Versions</th>
            <th class="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pkg in packages" :key="pkg.hashID || pkg.id" :data-test-id="`remote-task-management.packages.row.${pkg.hashID || pkg.id}`" class="border-t border-white/10">
            <td class="px-4 py-4">
              <div class="font-medium text-white">{{ pkg.name || pkg.hashID || pkg.id }}</div>
              <div class="text-sm leading-6 text-slate-400">{{ pkg.package_description || '-' }}</div>
            </td>
            <td class="px-4 py-4 text-slate-300">{{ pkg.author?.email || '-' }}</td>
            <td class="px-4 py-4 text-slate-300">{{ pkg.versions?.length || 0 }}</td>
            <td class="px-4 py-4">
              <div class="flex flex-wrap gap-2">
                <button class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]" @click="openDetail(pkg.hashID || String(pkg.id || ''))">Details</button>
                <button class="inline-flex items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-300/35 hover:bg-amber-500/16" @click="router.push({ name: nameOf('pending-instances') })">Pending</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </BundlePage>
</template>
