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
      <div class="min-w-0 space-y-1">
        <h1 class="break-all text-2xl font-semibold text-foreground">{{ detail?.name || detail?.connector_id || connectorId }}</h1>
        <p class="overflow-hidden break-words text-sm leading-6 text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">{{ detail?.package_description || detail?.summary || '' }}</p>
      </div>
      <button class="inline-flex shrink-0 items-center justify-center rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40" @click="router.back()">Back</button>
    </header>

    <div v-if="loading" class="rounded-3xl border border-border bg-background p-6 text-sm text-muted-foreground">Loading...</div>
    <div v-else-if="error" class="rounded-3xl border border-rose-200/70 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-200">{{ error }}</div>
    <template v-else-if="detail">
      <section class="rounded-3xl border border-amber-200/70 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-950/15">
        <div class="text-sm font-medium text-amber-900 dark:text-amber-200">{{ detail.status || 'discoverable' }}</div>
        <p class="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-100">{{ detail.summary || '当前团队作用域下尚不能直接连接该 connector。' }}</p>
      </section>

      <section class="rounded-3xl border border-border bg-background p-6">
        <h2 class="text-base font-semibold text-foreground">{{ runtime.t('teamConnectors.detail.nextSteps', '接入方式') }}</h2>
        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li v-for="(step, index) in detail.next_steps || []" :key="`${index}-${step}`">{{ step }}</li>
        </ul>
      </section>
    </template>
  </section>
</template>
