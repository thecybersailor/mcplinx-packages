<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConnectorWorkbenchRuntime, type ConnectorWorkbenchCard } from '../facade'

const runtime = useConnectorWorkbenchRuntime()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const rows = ref<ConnectorWorkbenchCard[]>([])

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await runtime.facade.getWorkbench()
    rows.value = response.discoverable_connectors ?? []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
    rows.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section data-test-id="team-connectors.catalog.page" class="space-y-4">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold text-slate-950">{{ runtime.t('teamConnectors.catalog.title', '全部未接入 connectors') }}</h1>
      <p class="text-sm text-slate-500">{{ runtime.t('teamConnectors.catalog.description', 'All discoverable connectors for the current team scope.') }}</p>
    </header>

    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading...</div>
    <div v-else-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{{ error }}</div>
    <div v-else-if="!rows.length" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No discoverable connectors.</div>
    <div v-else class="grid gap-4 md:grid-cols-2">
      <article
        v-for="connector in rows"
        :key="connector.id"
        :data-test-id="`team-connectors.catalog.card.${connector.id}`"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <button
          class="flex w-full flex-col items-start gap-2 text-left"
          @click="router.push({ name: `${runtime.routePrefix}-discoverable-detail`, params: { connectorId: connector.id } })"
        >
          <h2 class="text-base font-semibold text-slate-950">{{ connector.name || connector.id }}</h2>
          <p class="text-sm leading-6 text-slate-500">{{ connector.package_description || '-' }}</p>
          <span class="text-xs font-medium uppercase tracking-wide text-slate-400">{{ connector.version || '-' }}</span>
        </button>
      </article>
    </div>
  </section>
</template>
