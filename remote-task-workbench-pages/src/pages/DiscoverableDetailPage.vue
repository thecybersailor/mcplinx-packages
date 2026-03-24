<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConnectorWorkbenchRuntime, type ConnectorWorkbenchDetail, type ConnectorWorkbenchInstance, type ConnectorWorkbenchVersion } from '../facade'

const runtime = useConnectorWorkbenchRuntime()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const detail = ref<ConnectorWorkbenchDetail | null>(null)
const versions = ref<ConnectorWorkbenchVersion[]>([])
const instances = ref<ConnectorWorkbenchInstance[]>([])
const connectorId = computed(() => String(route.params.connectorId ?? ''))

async function load() {
  if (!connectorId.value) return
  loading.value = true
  error.value = ''
  try {
    const [detailData, versionData, instanceData] = await Promise.all([
      runtime.facade.getConnectorDetail(connectorId.value),
      runtime.facade.listPackageVersions?.(connectorId.value) ?? Promise.resolve([]),
      runtime.facade.listPackageInstances?.(connectorId.value) ?? Promise.resolve([]),
    ])
    detail.value = detailData
    versions.value = versionData
    instances.value = instanceData
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
    detail.value = null
    versions.value = []
    instances.value = []
  } finally {
    loading.value = false
  }
}

function openConnect() {
  if (!connectorId.value) return
  void router.push({ name: `${runtime.routePrefix}-connect`, params: { connectorId: connectorId.value } })
}

onMounted(load)
</script>

<template>
  <section data-test-id="team-connectors.detail.page" class="space-y-4">
    <header class="flex items-start justify-between gap-4">
      <div class="min-w-0 space-y-1">
        <h1 class="break-all text-2xl font-semibold text-foreground">{{ detail?.name || detail?.connector_id || connectorId }}</h1>
        <p class="text-sm text-muted-foreground">Package: {{ detail?.connector_id || connectorId }}</p>
      </div>
      <button class="inline-flex shrink-0 items-center justify-center rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40" @click="router.back()">Back</button>
    </header>

    <div v-if="loading" class="rounded-3xl border border-border bg-background p-6 text-sm text-muted-foreground">Loading...</div>
    <div v-else-if="error" class="rounded-3xl border border-rose-200/70 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-200">{{ error }}</div>
    <template v-else-if="detail">
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_320px]">
        <div class="space-y-4">
          <section class="rounded-3xl border border-border bg-background p-6">
            <h2 class="text-base font-semibold text-foreground">接入方式</h2>
            <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              <li v-for="(step, index) in detail.next_steps || []" :key="`${index}-${step}`">{{ step }}</li>
              <li v-if="!(detail.next_steps || []).length">{{ detail.summary || '当前团队作用域下尚不能直接连接该 connector。' }}</li>
            </ul>
          </section>

          <section class="rounded-3xl border border-border bg-background p-6">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-base font-semibold text-foreground">All Versions</h2>
              <span class="text-sm text-muted-foreground">{{ versions.length }}</span>
            </div>
            <div v-if="!versions.length" class="mt-4 text-sm text-muted-foreground">No versions found.</div>
            <div v-else class="mt-4 overflow-hidden rounded-2xl border border-border">
              <table class="min-w-full">
                <thead class="bg-muted/30 text-left text-sm text-muted-foreground">
                  <tr>
                    <th class="px-4 py-3 font-medium">Version</th>
                    <th class="px-4 py-3 font-medium">Tools</th>
                    <th class="px-4 py-3 font-medium">Size</th>
                    <th class="px-4 py-3 font-medium">Uploaded At</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="version in versions" :key="String(version.id ?? version.version)" class="border-t border-border">
                    <td class="px-4 py-4 text-foreground">{{ version.version || '-' }}</td>
                    <td class="px-4 py-4 text-muted-foreground">{{ version.toolCount ?? 0 }}</td>
                    <td class="px-4 py-4 text-muted-foreground">{{ version.size || '-' }}</td>
                    <td class="px-4 py-4 text-muted-foreground">{{ version.uploadedAt || version.createdAt || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="rounded-3xl border border-border bg-background p-6">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-base font-semibold text-foreground">My Instances</h2>
              <button class="inline-flex items-center justify-center rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40" @click="openConnect()">Create Instance</button>
            </div>
            <div v-if="!instances.length" class="mt-4 text-sm text-muted-foreground">No instances found.</div>
            <div v-else class="mt-4 space-y-3">
              <article v-for="instance in instances" :key="String(instance.id)" class="rounded-2xl border border-border bg-muted/10 p-4">
                <div class="flex flex-wrap items-center gap-2">
                  <div class="font-medium text-foreground">{{ instance.name || instance.id }}</div>
                  <span class="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">{{ instance.visibility || '-' }}</span>
                  <span class="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">{{ instance.status || '-' }}</span>
                </div>
                <div class="mt-2 text-sm text-muted-foreground">Active Version: {{ instance.activeVersion || '-' }}</div>
                <div class="mt-1 break-all text-sm text-muted-foreground">OAuth Callback URL: {{ instance.oauthCallbackURL || '-' }}</div>
              </article>
            </div>
          </section>
        </div>

        <aside class="space-y-4">
          <section class="rounded-3xl border border-border bg-background p-6">
            <h2 class="text-base font-semibold text-foreground">Connector Icon</h2>
            <div class="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">Icon preview</div>
          </section>

          <section class="rounded-3xl border border-border bg-background p-6">
            <h2 class="text-base font-semibold text-foreground">Latest Version Info</h2>
            <dl class="mt-4 space-y-2 text-sm">
              <div class="flex items-start justify-between gap-4">
                <dt class="text-muted-foreground">Latest Version</dt>
                <dd class="text-foreground">{{ detail.latest_version || '-' }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4">
                <dt class="text-muted-foreground">Available Tools</dt>
                <dd class="text-foreground">{{ detail.tool_count ?? 0 }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4">
                <dt class="text-muted-foreground">Summary</dt>
                <dd class="max-w-[180px] text-right text-foreground">{{ detail.summary || '-' }}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </template>
  </section>
</template>
