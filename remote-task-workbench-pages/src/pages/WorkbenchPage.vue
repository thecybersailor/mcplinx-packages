<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConnectorWorkbenchRuntime, type ConnectorWorkbenchResponse } from '../facade'

const runtime = useConnectorWorkbenchRuntime()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const workbench = ref<ConnectorWorkbenchResponse>({})

function nameOf(suffix: string) {
  return `${runtime.routePrefix}-${suffix}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    workbench.value = await runtime.facade.getWorkbench({ limit: 6 })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
    workbench.value = {}
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section data-test-id="team-connectors.workbench.page" class="space-y-6">
    <div class="flex justify-end">
      <button
        data-test-id="team-connectors.more.top"
        class="inline-flex items-center justify-center rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40"
        @click="router.push({ name: nameOf('catalog') })"
      >
        {{ runtime.t('teamConnectors.more', '显示更多') }}
      </button>
    </div>

    <div v-if="loading" class="rounded-3xl border border-border bg-background p-6 text-sm text-muted-foreground">Loading...</div>
    <div v-else-if="error" class="rounded-3xl border border-rose-200/70 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-200">{{ error }}</div>
    <template v-else>
      <section class="space-y-3">
        <div>
          <h2 class="text-lg font-semibold text-foreground">{{ runtime.t('teamConnectors.available.title', '已经可直接连接') }}</h2>
          <p class="text-sm text-muted-foreground">{{ runtime.t('teamConnectors.available.description', 'These connectors can be connected right now in the current team scope.') }}</p>
        </div>
        <div v-if="workbench.available_connectors?.length" class="grid gap-4 md:grid-cols-2">
          <article
            v-for="connector in workbench.available_connectors"
            :key="connector.id"
            :data-test-id="`team-connectors.available.card.${connector.id}`"
            class="flex h-full min-w-0 flex-col rounded-3xl border border-border bg-background p-5"
          >
            <div class="min-w-0 space-y-1">
              <h3 class="break-all text-base font-semibold text-foreground">{{ connector.name || connector.id }}</h3>
              <p class="overflow-hidden break-words text-sm leading-6 text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">{{ connector.package_description || '-' }}</p>
            </div>
            <div class="mt-6 flex items-center justify-between gap-4">
              <span class="shrink-0 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground/80">{{ connector.version || '-' }}</span>
              <button
                :data-test-id="`team-connectors.available.connect.${connector.id}`"
                class="inline-flex items-center justify-center rounded-2xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
                @click="router.push({ name: nameOf('connect'), params: { connectorId: connector.id } })"
              >
                {{ runtime.t('teamConnectors.available.connect', 'Connect') }}
              </button>
            </div>
          </article>
        </div>
        <div v-else class="rounded-3xl border border-border bg-background p-6 text-sm text-muted-foreground">
          {{ runtime.t('teamConnectors.available.empty', '当前团队作用域下还没有可以直接连接的 connector。') }}
        </div>
      </section>

      <section class="space-y-3">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-foreground">{{ runtime.t('teamConnectors.discoverable.title', '尚未接入') }}</h2>
            <p class="text-sm text-muted-foreground">{{ runtime.t('teamConnectors.discoverable.description', 'Browse connectors that are visible but not yet directly connectable in this team scope.') }}</p>
          </div>
        </div>
        <div v-if="workbench.discoverable_connectors?.length" class="grid gap-4 md:grid-cols-2">
          <article
            v-for="connector in workbench.discoverable_connectors"
            :key="connector.id"
            :data-test-id="`team-connectors.discoverable.card.${connector.id}`"
            class="rounded-3xl border border-border bg-background p-5"
          >
            <button
              class="flex w-full min-w-0 flex-col items-start gap-2 text-left"
              @click="router.push({ name: nameOf('discoverable-detail'), params: { connectorId: connector.id } })"
            >
              <h3 class="break-all text-base font-semibold text-foreground">{{ connector.name || connector.id }}</h3>
              <p class="overflow-hidden break-words text-sm leading-6 text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">{{ connector.package_description || '-' }}</p>
              <span class="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground/80">{{ connector.version || '-' }}</span>
            </button>
          </article>
        </div>
        <div v-else class="rounded-3xl border border-border bg-background p-6 text-sm text-muted-foreground">
          {{ runtime.t('teamConnectors.discoverable.empty', '没有更多待接入 connector。') }}
        </div>
      </section>

      <div class="flex justify-center">
        <button
          data-test-id="team-connectors.more.bottom"
          class="inline-flex items-center justify-center rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40"
          @click="router.push({ name: nameOf('catalog') })"
        >
          {{ runtime.t('teamConnectors.more', '显示更多') }}
        </button>
      </div>
    </template>
  </section>
</template>
