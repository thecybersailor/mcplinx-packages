<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const loading = ref(true)
const error = ref('')
const instances = ref<Awaited<ReturnType<typeof runtime.facade.listInstances>>>([])
const selectedId = ref('')
const reason = ref('')

const selected = computed(() => instances.value.find((item) => String(item.id) === selectedId.value) ?? null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    instances.value = await runtime.facade.listInstances({ status: 'pending_review' })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
    instances.value = []
  } finally {
    loading.value = false
  }
}

async function review(action: 'approve' | 'reject') {
  if (!selected.value?.id || !runtime.facade.reviewInstance) return
  await runtime.facade.reviewInstance(String(selected.value.id), {
    action,
    reason: reason.value || undefined,
  })
  reason.value = ''
  selectedId.value = ''
  await load()
}

onMounted(load)
</script>

<template>
  <BundlePage data-test-id="remote-task-management.pending-instances.page" title="Pending Instances" description="Moderation queue with the same review UI across every admin host.">
    <BundleState v-if="loading" variant="loading" message="Loading..." />
    <BundleState v-else-if="error" variant="error" :message="error" />
    <BundleState v-else-if="!instances.length" variant="empty" message="No pending instances." />
    <div v-else class="grid gap-4 lg:grid-cols-[2fr,1fr]">
      <div class="overflow-hidden rounded-2xl border border-slate-200">
        <table data-test-id="remote-task-management.pending.table" class="min-w-full bg-white">
          <thead class="bg-slate-50 text-left text-sm text-slate-500"><tr><th class="px-4 py-3 font-medium">Name</th><th class="px-4 py-3 font-medium">Status</th><th class="px-4 py-3 font-medium">Select</th></tr></thead>
          <tbody>
            <tr v-for="instance in instances" :key="instance.id" class="border-t border-slate-200">
              <td class="px-4 py-4 text-slate-800">{{ instance.name || instance.id }}</td>
              <td class="px-4 py-4 text-slate-600">{{ instance.status || '-' }}</td>
              <td class="px-4 py-4">
                <button :data-test-id="`remote-task-management.pending.select.${instance.id}`" class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="selectedId = String(instance.id)">Select</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <BundlePanel>
        <h2 class="mb-3 text-base font-semibold text-slate-950">Review</h2>
        <p class="mb-3 text-sm leading-6 text-slate-500">{{ selected?.name || 'Choose an instance' }}</p>
        <textarea v-model="reason" data-test-id="remote-task-management.pending.reason" class="mb-3 min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" />
        <div class="flex flex-wrap gap-2">
          <button data-test-id="remote-task-management.pending.approve" class="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" :disabled="!selectedId" @click="review('approve')">Approve</button>
          <button data-test-id="remote-task-management.pending.reject" class="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100" :disabled="!selectedId" @click="review('reject')">Reject</button>
        </div>
      </BundlePanel>
    </div>
  </BundlePage>
</template>
