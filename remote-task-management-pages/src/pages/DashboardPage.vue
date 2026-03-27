<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@mcplinx/ui-vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
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
    :title="runtime.t('remoteTaskManagement.dashboard.title', 'Connectors')"
    :description="runtime.t('remoteTaskManagement.dashboard.scope', 'Scope: {scope}', { scope: runtime.scope })"
    borderless
  >
    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskManagement.dashboard.loading', 'Loading connectors dashboard...')" />
    <BundleState v-else-if="error" variant="error" :message="error" :action-label="runtime.t('remoteTaskManagement.common.refresh', 'Refresh')" @action="load" />

    <div v-else class="space-y-4">
      <BundlePanel>
        <h2 class="text-lg font-semibold text-white">{{ runtime.t('remoteTaskManagement.dashboard.connectionsTitle', 'Connections') }}</h2>
        <p class="mt-2 text-sm leading-6 text-slate-400">
          {{ runtime.t('remoteTaskManagement.dashboard.connectionsDesc', 'Open the shared connection task surface without leaving the connector domain.') }}
        </p>
        <Button
          data-test-id="remote-task-management.dashboard.open-connections"
          variant="outline"
          class="mt-5"
          @click="openConnections"
        >
          {{ runtime.t('remoteTaskManagement.dashboard.openConnections', 'Open Connections') }}
        </Button>
      </BundlePanel>

      <BundlePanel>
        <h2 class="text-lg font-semibold text-white">{{ runtime.t('remoteTaskManagement.dashboard.connectorsTitle', 'Connectors') }}</h2>
        <p class="mt-2 text-sm leading-6 text-slate-400">
          {{ runtime.t('remoteTaskManagement.dashboard.connectorsDesc', 'Review connector packages and moderate instances inside the same connector domain.') }}
        </p>
        <div class="mt-4 text-sm text-slate-300">
          {{ runtime.t('remoteTaskManagement.dashboard.packagesCount', 'Packages:') }} <span class="font-medium text-white">{{ packageCount }}</span><br>
          {{ runtime.t('remoteTaskManagement.dashboard.pendingReviewCount', 'Pending Review:') }} <span class="font-medium text-white">{{ pendingReviewCount }}</span>
        </div>
        <Button
          data-test-id="remote-task-management.dashboard.open-connectors"
          variant="outline"
          class="mt-5"
          @click="openConnectors"
        >
          {{ runtime.t('remoteTaskManagement.dashboard.openConnectors', 'Open Connectors') }}
        </Button>
        <div class="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          <h3 class="text-sm font-semibold text-white">{{ runtime.t('remoteTaskManagement.dashboard.cliHint', 'CLI Hint') }}</h3>
          <p class="mt-2 text-sm leading-6 text-slate-400">
            {{ runtime.t('remoteTaskManagement.dashboard.cliHintDesc', 'Use the CLI to build and deploy connector packages before you return to governance pages.') }}
          </p>
          <div class="mt-4 space-y-3 text-xs leading-6 text-slate-300">
            <pre class="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-3"><code>{{ loginCommand }}</code></pre>
            <pre class="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-3"><code>{{ buildCommand }}</code></pre>
            <pre class="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-3"><code>{{ deployCommand }}</code></pre>
          </div>
        </div>
      </BundlePanel>
    </div>
  </BundlePage>
</template>
