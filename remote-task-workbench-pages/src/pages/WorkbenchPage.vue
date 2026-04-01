<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConnectorWorkbenchRuntime, type ConnectorWorkbenchCard, type ConnectorWorkbenchResponse } from '../facade'

const runtime = useConnectorWorkbenchRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const workbench = ref<ConnectorWorkbenchResponse>({})
const cliHintOpen = ref(false)

function nameOf(suffix: string) {
  return `${runtime.routePrefix}-${suffix}`
}

const teamId = computed(() => {
  const value = route.params.teamId
  return typeof value === 'string' ? value.trim() : ''
})

const loginUrl = computed(() => {
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  if (!origin || !teamId.value) return ''
  return `${origin}/team/${teamId.value}/linktool-login`
})

const loginCommand = computed(() => `syntool login --login-url ${loginUrl.value || '<login-url>'}`)
const buildCommand = computed(() => 'syntool build')
const publishCommand = computed(() => 'syntool publish')
const deployCommand = computed(() => 'syntool deploy --payload \'{"name":"<package>","version":"<version>"}\'')

const rows = computed<ConnectorWorkbenchCard[]>(() => {
  return [...(workbench.value.available_connectors ?? []), ...(workbench.value.discoverable_connectors ?? [])]
})

function versionOf(connector: ConnectorWorkbenchCard) {
  return connector.version || '-'
}

function toolCountOf(connector: ConnectorWorkbenchCard) {
  return (connector as Record<string, unknown>).tool_count ?? 0
}

function updatedAtOf(connector: ConnectorWorkbenchCard) {
  return String((connector as Record<string, unknown>).updated_at ?? '-')
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

function openDetail(connector: ConnectorWorkbenchCard) {
  if (!connector.id) return
  void router.push({ name: nameOf('discoverable-detail'), params: { connectorId: connector.id } })
}

onMounted(load)
</script>

<template>
  <section data-test-id="team-connectors.workbench.page" class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold text-foreground">{{ runtime.t('teamConnectors.title', 'My Connector Packages') }}</h1>
    </header>

    <section data-test-id="team-connectors.cli-hint.section" class="rounded-3xl border border-border bg-background p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <div class="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground/80">{{ runtime.t('teamConnectors.cli.eyebrow', 'Getting Started') }}</div>
          <h2 class="text-base font-semibold text-foreground">{{ runtime.t('teamConnectors.cli.title', 'Getting Started') }}</h2>
          <p class="text-sm text-muted-foreground">{{ runtime.t('teamConnectors.cli.description', 'Build and publish connector packages from the CLI when you are ready to add a new integration.') }}</p>
        </div>
        <button
          data-test-id="team-connectors.cli-hint.toggle"
          class="inline-flex items-center justify-center rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40"
          @click="cliHintOpen = !cliHintOpen"
        >
          {{ cliHintOpen ? runtime.t('teamConnectors.cli.hide', 'Hide CLI') : runtime.t('teamConnectors.cli.show', 'Show CLI') }}
        </button>
      </div>

      <div v-if="cliHintOpen" data-test-id="team-connectors.cli-hint.panel" class="mt-4 space-y-4">
        <div class="space-y-2">
          <pre class="overflow-x-auto rounded-2xl border border-border bg-muted/30 p-3 text-xs leading-6 text-foreground"><code>{{ loginCommand }}</code></pre>
        </div>
        <div class="space-y-2">
          <pre class="overflow-x-auto rounded-2xl border border-border bg-muted/30 p-3 text-xs leading-6 text-foreground"><code>{{ buildCommand }}</code></pre>
        </div>
        <div class="space-y-2">
          <pre class="overflow-x-auto rounded-2xl border border-border bg-muted/30 p-3 text-xs leading-6 text-foreground"><code>{{ publishCommand }}</code></pre>
        </div>
        <div class="space-y-2">
          <pre class="overflow-x-auto rounded-2xl border border-border bg-muted/30 p-3 text-xs leading-6 text-foreground"><code>{{ deployCommand }}</code></pre>
        </div>
      </div>
    </section>

    <div v-if="loading" class="rounded-3xl border border-border bg-background p-6 text-sm text-muted-foreground">Loading...</div>
    <div v-else-if="error" class="rounded-3xl border border-rose-200/70 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-200">{{ error }}</div>
    <div v-else-if="!rows.length" class="rounded-3xl border border-border bg-background p-6 text-sm text-muted-foreground">
      {{ runtime.t('teamConnectors.empty', 'No connector packages found.') }}
    </div>
    <div v-else class="overflow-hidden rounded-3xl border border-border bg-background">
      <table class="min-w-full">
        <thead class="bg-muted/30 text-left text-sm text-muted-foreground">
          <tr>
            <th class="px-4 py-3 font-medium">Application</th>
            <th class="px-4 py-3 font-medium">Version</th>
            <th class="px-4 py-3 font-medium">Tools</th>
            <th class="px-4 py-3 font-medium">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="connector in rows"
            :key="connector.id"
            :data-test-id="`team-connectors.row.${connector.id}`"
            class="cursor-pointer border-t border-border transition hover:bg-muted/20"
            @click="openDetail(connector)"
          >
            <td class="px-4 py-4">
              <div class="font-medium text-foreground">{{ connector.name || connector.id }}</div>
              <div class="text-sm text-muted-foreground">{{ connector.package_description || '-' }}</div>
            </td>
            <td class="px-4 py-4 text-muted-foreground">{{ versionOf(connector) }}</td>
            <td class="px-4 py-4 text-muted-foreground">{{ toolCountOf(connector) }}</td>
            <td class="px-4 py-4 text-muted-foreground">{{ updatedAtOf(connector) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex justify-end">
      <button
        data-test-id="team-connectors.more.bottom"
        class="inline-flex items-center justify-center rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40"
        @click="router.push({ name: nameOf('catalog') })"
      >
        {{ runtime.t('teamConnectors.more', 'Show more') }}
      </button>
    </div>
  </section>
</template>
