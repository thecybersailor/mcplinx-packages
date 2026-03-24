<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const packageCount = ref(0)
const pendingReviewCount = ref(0)

function openConnectors() {
  void router.push({ name: `${runtime.routePrefix}-packages` })
}

function openConnections() {
  if (!runtime.sharedConnectionRoutePrefix) return
  void router.push({ name: `${runtime.sharedConnectionRoutePrefix}-connections` })
}

const loginCommand = computed(() => 'linktool login --login-url <login-url>')
const buildCommand = computed(() => 'linktool build')
const deployCommand = computed(() => 'linktool deploy')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [packages, pendingInstances] = await Promise.all([
      runtime.facade.listPackages(),
      runtime.facade.listInstances({ status: 'pending_review' }),
    ])
    packageCount.value = packages.length
    pendingReviewCount.value = pendingInstances.length
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
    packageCount.value = 0
    pendingReviewCount.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <BundlePage
    data-test-id="remote-task-management.dashboard.page"
    title="Connectors"
    :description="`Scope: ${runtime.scope}`"
    borderless
  >
    <BundleState v-if="loading" variant="loading" message="Loading connectors dashboard..." />
    <BundleState v-else-if="error" variant="error" :message="error" action-label="Refresh" @action="load" />

    <div v-else class="space-y-4">
      <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 class="text-lg font-semibold text-white">Connections</h2>
        <p class="mt-2 text-sm leading-6 text-slate-400">
          Open the shared connection task surface without leaving the connector domain.
        </p>
        <button
          data-test-id="remote-task-management.dashboard.open-connections"
          class="mt-5 inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]"
          @click="openConnections"
        >
          Open Connections
        </button>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 class="text-lg font-semibold text-white">Connectors</h2>
        <p class="mt-2 text-sm leading-6 text-slate-400">
          Review connector packages and moderate instances inside the same connector domain.
        </p>
        <div class="mt-4 text-sm text-slate-300">
          Packages: <span class="font-medium text-white">{{ packageCount }}</span><br>
          Pending Review: <span class="font-medium text-white">{{ pendingReviewCount }}</span>
        </div>
        <button
          data-test-id="remote-task-management.dashboard.open-connectors"
          class="mt-5 inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]"
          @click="openConnectors"
        >
          Open Connectors
        </button>
        <div class="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          <h3 class="text-sm font-semibold text-white">CLI Hint</h3>
          <p class="mt-2 text-sm leading-6 text-slate-400">
            Use the CLI to build and deploy connector packages before you return to governance pages.
          </p>
          <div class="mt-4 space-y-3 text-xs leading-6 text-slate-300">
            <pre class="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-3"><code>{{ loginCommand }}</code></pre>
            <pre class="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-3"><code>{{ buildCommand }}</code></pre>
            <pre class="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-3"><code>{{ deployCommand }}</code></pre>
          </div>
        </div>
      </section>
    </div>
  </BundlePage>
</template>
