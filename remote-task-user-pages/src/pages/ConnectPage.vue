<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskUserRuntime } from '../facade'

const runtime = useRemoteTaskUserRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const connectorId = computed(() => String(route.params.id ?? route.query.connectorId ?? ''))
async function startConnect() {
  if (!connectorId.value) {
    error.value = 'Missing connector id'
    loading.value = false
    return
  }
  error.value = ''
  try {
    const response = await runtime.facade.createConnection({
      connector_id: connectorId.value,
    })
    if (response.url && typeof window !== 'undefined') {
      window.location.href = response.url
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
</script>

<template>
  <BundlePage
    data-test-id="remote-task-user.connect.page"
    :title="runtime.t('remoteTaskUser.connectPage.title', 'Connect')"
    :description="`Connector ID: ${connectorId || '-'}`"
  >
    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskUser.connectPage.redirecting', 'Redirecting to the provider authorization page...')" />
    <BundleState v-else-if="error" variant="error" :message="error" />
  </BundlePage>
</template>
