<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConnectorWorkbenchRuntime } from '../facade'

const runtime = useConnectorWorkbenchRuntime()
const route = useRoute()
const router = useRouter()
const connectorId = computed(() => String(route.params.connectorId ?? ''))
const label = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  if (!connectorId.value) {
    error.value = 'Missing connector id'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await runtime.facade.createConnection({
      connector_id: connectorId.value,
      label: label.value || undefined,
    })
    await router.push({ name: `${runtime.routePrefix}-workbench` })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section data-test-id="team-connectors.connect.page" class="space-y-4">
    <header class="space-y-1">
      <h1 class="break-all text-2xl font-semibold text-foreground">{{ runtime.t('teamConnectors.connect.title', 'Create connection') }}</h1>
      <p class="break-all text-sm text-muted-foreground">Connector ID: {{ connectorId || '-' }}</p>
    </header>

    <div class="rounded-3xl border border-border bg-background p-6">
      <label class="grid gap-2">
        <span class="text-sm font-medium text-foreground">{{ runtime.t('teamConnectors.connect.label', 'Connection label') }}</span>
        <input v-model="label" data-test-id="team-connectors.connect.label" class="rounded-2xl border border-border bg-background px-3 py-2 text-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring">
      </label>
    </div>

    <div v-if="error" class="rounded-3xl border border-rose-200/70 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-200">{{ error }}</div>

    <button
      data-test-id="team-connectors.connect.submit"
      class="inline-flex items-center justify-center rounded-2xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="loading"
      @click="submit"
    >
      {{ loading ? 'Loading...' : runtime.t('teamConnectors.connect.submit', 'Create connection') }}
    </button>
  </section>
</template>
