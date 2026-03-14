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
      <h1 class="text-2xl font-semibold text-foreground">{{ runtime.t('teamConnectors.catalog.title', '全部未接入 connectors') }}</h1>
      <p class="text-sm text-muted-foreground">{{ runtime.t('teamConnectors.catalog.description', 'All discoverable connectors for the current team scope.') }}</p>
    </header>

    <div v-if="loading" class="rounded-3xl border border-border bg-background p-6 text-sm text-muted-foreground">Loading...</div>
    <div v-else-if="error" class="rounded-3xl border border-rose-200/70 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-200">{{ error }}</div>
    <div v-else-if="!rows.length" class="rounded-3xl border border-border bg-background p-6 text-sm text-muted-foreground">No discoverable connectors.</div>
    <div v-else class="grid gap-4 md:grid-cols-2">
      <article
        v-for="connector in rows"
        :key="connector.id"
        :data-test-id="`team-connectors.catalog.card.${connector.id}`"
        class="rounded-3xl border border-border bg-background p-5"
      >
        <button
          class="flex w-full min-w-0 flex-col items-start gap-2 text-left"
          @click="router.push({ name: `${runtime.routePrefix}-discoverable-detail`, params: { connectorId: connector.id } })"
        >
          <h2 class="break-all text-base font-semibold text-foreground">{{ connector.name || connector.id }}</h2>
          <p class="overflow-hidden break-words text-sm leading-6 text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">{{ connector.package_description || '-' }}</p>
          <span class="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground/80">{{ connector.version || '-' }}</span>
        </button>
      </article>
    </div>
  </section>
</template>
