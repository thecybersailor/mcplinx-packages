<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const instances = ref<Awaited<ReturnType<typeof runtime.facade.listInstances>>>([])
const status = ref('')

function nameOf(suffix: string) {
  return `${runtime.routePrefix}-${suffix}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    instances.value = await runtime.facade.listInstances(status.value ? { status: status.value } : undefined)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
    instances.value = []
  } finally {
    loading.value = false
  }
}

function detail(id?: number) {
  if (id == null) return
  void router.push({ name: nameOf('instance-detail'), params: { instanceId: String(id) } })
}

onMounted(load)
</script>

<template>
  <BundlePage data-test-id="remote-task-management.instances.page" title="Instances" description="Consistent instance review list across platform and tenant admin hosts.">
    <template #actions>
      <input v-model="status" data-test-id="remote-task-management.instances.status" class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" placeholder="status filter" />
      <button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="load">Refresh</button>
    </template>

    <BundleState v-if="loading" variant="loading" message="Loading..." />
    <BundleState v-else-if="error" variant="error" :message="error" action-label="Refresh" @action="load" />
    <BundleState v-else-if="!instances.length" variant="empty" message="No instances." />
    <div v-else class="overflow-hidden rounded-2xl border border-slate-200">
      <table data-test-id="remote-task-management.instances.table" class="min-w-full bg-white">
        <thead class="bg-slate-50 text-left text-sm text-slate-500"><tr><th class="px-4 py-3 font-medium">Name</th><th class="px-4 py-3 font-medium">Status</th><th class="px-4 py-3 font-medium">Version</th><th class="px-4 py-3 font-medium">Actions</th></tr></thead>
        <tbody>
          <tr v-for="instance in instances" :key="instance.id" :data-test-id="`remote-task-management.instances.row.${instance.id}`" class="border-t border-slate-200">
            <td class="px-4 py-4 text-slate-800">{{ instance.name || instance.id }}</td>
            <td class="px-4 py-4 text-slate-600">{{ instance.status || '-' }}</td>
            <td class="px-4 py-4 text-slate-600">{{ instance.activeVersion || '-' }}</td>
            <td class="px-4 py-4"><button class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="detail(instance.id)">Details</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </BundlePage>
</template>
