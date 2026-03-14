<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConnectorWorkbenchRuntime, type ConnectorWorkbenchDetail } from '../facade'

const runtime = useConnectorWorkbenchRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const detail = ref<ConnectorWorkbenchDetail | null>(null)
const connectorId = computed(() => String(route.params.connectorId ?? ''))

async function load() {
  if (!connectorId.value) return
  loading.value = true
  error.value = ''
  try {
    detail.value = await runtime.facade.getConnectorDetail(connectorId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
    detail.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section data-test-id="team-connectors.detail.page" class="space-y-4">
    <header class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold text-slate-950">{{ detail?.name || detail?.connector_id || connectorId }}</h1>
        <p class="text-sm leading-6 text-slate-500">{{ detail?.package_description || detail?.summary || '' }}</p>
      </div>
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="router.back()">Back</button>
    </header>

    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading...</div>
    <div v-else-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{{ error }}</div>
    <template v-else-if="detail">
      <section class="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div class="text-sm font-medium text-amber-900">{{ detail.status || 'discoverable' }}</div>
        <p class="mt-2 text-sm leading-6 text-amber-800">{{ detail.summary || '当前团队作用域下尚不能直接连接该 connector。' }}</p>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="text-base font-semibold text-slate-950">{{ runtime.t('teamConnectors.detail.nextSteps', '接入方式') }}</h2>
        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
          <li v-for="(step, index) in detail.next_steps || []" :key="`${index}-${step}`">{{ step }}</li>
        </ul>
      </section>
    </template>
  </section>
</template>
