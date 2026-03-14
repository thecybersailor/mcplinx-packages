<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTeamConnectorWorkbenchRuntime, type TeamConnectorWorkbenchResponse } from '../facade'

const runtime = useTeamConnectorWorkbenchRuntime()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const workbench = ref<TeamConnectorWorkbenchResponse>({})

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
    <header class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-950">{{ runtime.t('teamConnectors.workbench.title', 'Connectors') }}</h1>
        <p class="mt-1 text-sm text-slate-500">{{ runtime.t('teamConnectors.workbench.description', 'Connect a connector that is already available in this team scope.') }}</p>
      </div>
      <button
        data-test-id="team-connectors.more.top"
        class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        @click="router.push({ name: nameOf('catalog') })"
      >
        {{ runtime.t('teamConnectors.more', '显示更多') }}
      </button>
    </header>

    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading...</div>
    <div v-else-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{{ error }}</div>
    <template v-else>
      <section class="space-y-3">
        <div>
          <h2 class="text-lg font-semibold text-slate-950">{{ runtime.t('teamConnectors.available.title', '已经可直接连接') }}</h2>
          <p class="text-sm text-slate-500">{{ runtime.t('teamConnectors.available.description', 'These connectors can be connected right now in the current team scope.') }}</p>
        </div>
        <div v-if="workbench.available_connectors?.length" class="grid gap-4 md:grid-cols-2">
          <article
            v-for="connector in workbench.available_connectors"
            :key="connector.id"
            :data-test-id="`team-connectors.available.card.${connector.id}`"
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="space-y-1">
              <h3 class="text-base font-semibold text-slate-950">{{ connector.name || connector.id }}</h3>
              <p class="text-sm leading-6 text-slate-500">{{ connector.package_description || '-' }}</p>
            </div>
            <div class="mt-4 flex items-center justify-between gap-4">
              <span class="text-xs font-medium uppercase tracking-wide text-slate-400">{{ connector.version || '-' }}</span>
              <button
                :data-test-id="`team-connectors.available.connect.${connector.id}`"
                class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                @click="router.push({ name: nameOf('connect'), params: { connectorId: connector.id } })"
              >
                {{ runtime.t('teamConnectors.available.connect', 'Connect') }}
              </button>
            </div>
          </article>
        </div>
        <div v-else class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          {{ runtime.t('teamConnectors.available.empty', '当前团队作用域下还没有可以直接连接的 connector。') }}
        </div>
      </section>

      <section class="space-y-3">
        <div>
          <h2 class="text-lg font-semibold text-slate-950">{{ runtime.t('teamConnectors.discoverable.title', '尚未接入') }}</h2>
          <p class="text-sm text-slate-500">{{ runtime.t('teamConnectors.discoverable.description', 'Browse connectors that are visible but not yet directly connectable in this team scope.') }}</p>
        </div>
        <div v-if="workbench.discoverable_connectors?.length" class="grid gap-4 md:grid-cols-2">
          <article
            v-for="connector in workbench.discoverable_connectors"
            :key="connector.id"
            :data-test-id="`team-connectors.discoverable.card.${connector.id}`"
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <button
              class="flex w-full flex-col items-start gap-2 text-left"
              @click="router.push({ name: nameOf('discoverable-detail'), params: { connectorId: connector.id } })"
            >
              <h3 class="text-base font-semibold text-slate-950">{{ connector.name || connector.id }}</h3>
              <p class="text-sm leading-6 text-slate-500">{{ connector.package_description || '-' }}</p>
              <span class="text-xs font-medium uppercase tracking-wide text-slate-400">{{ connector.version || '-' }}</span>
            </button>
          </article>
        </div>
        <div v-else class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          {{ runtime.t('teamConnectors.discoverable.empty', '没有更多待接入 connector。') }}
        </div>
      </section>

      <div class="flex justify-center">
        <button
          data-test-id="team-connectors.more.bottom"
          class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          @click="router.push({ name: nameOf('catalog') })"
        >
          {{ runtime.t('teamConnectors.more', '显示更多') }}
        </button>
      </div>
    </template>
  </section>
</template>
