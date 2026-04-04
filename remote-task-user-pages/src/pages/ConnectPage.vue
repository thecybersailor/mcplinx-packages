<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskUserRuntime } from '../facade'
import { openAuthTaskWindow, type AuthTaskWindowController } from '../authTaskWindow'

const runtime = useRemoteTaskUserRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const manualAuthUrl = ref('')
const connectorId = computed(() => String(route.params.id ?? route.query.connectorId ?? ''))
let authController: AuthTaskWindowController | null = null
async function startConnect() {
  if (!connectorId.value) {
    error.value = 'Missing connector id'
    loading.value = false
    return
  }
  error.value = ''
  manualAuthUrl.value = ''
  try {
    const response = await runtime.facade.createConnection({
      connector_id: connectorId.value,
    })
    if (response.url && typeof window !== 'undefined') {
      authController?.cleanup()
      authController = openAuthTaskWindow({
        authUrl: response.url,
        authTaskFacade: runtime.authTaskFacade,
        onTerminal: async () => {
          loading.value = false
          await router.push({ name: `${runtime.routePrefix}-connections` })
        },
      })
      if (authController.popupBlocked) {
        manualAuthUrl.value = response.url
      }
      return
    }
    if (response.id) {
      await router.push({ name: `${runtime.routePrefix}-connection-detail`, params: { id: response.id } })
      return
    }
    error.value = runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed')
  } catch (err) {
    error.value = err instanceof Error ? err.message : runtime.t('remoteTaskUser.common.errorPrefix', 'Request failed')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void startConnect()
})

onUnmounted(() => {
  authController?.cleanup()
  authController = null
})
</script>

<template>
  <BundlePage
    data-test-id="remote-task-user.connect.page"
    :title="runtime.t('remoteTaskUser.connectPage.title', 'Connect')"
    :description="`Connector ID: ${connectorId || '-'}`"
  >
    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskUser.connectPage.redirecting', 'Redirecting to the provider authorization page...')" />
    <div
      v-if="manualAuthUrl"
      data-test-id="remote-task-user.connect.manual-auth"
      class="rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground"
    >
      <p class="mb-2">The browser blocked the auth popup. Open the auth page manually.</p>
      <a :href="manualAuthUrl" target="_blank" rel="noreferrer" class="underline">Open Authentication Page</a>
    </div>
    <BundleState v-else-if="error" variant="error" :message="error" />
  </BundlePage>
</template>
