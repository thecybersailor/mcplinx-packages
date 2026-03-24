<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BundlePage from '../components/BundlePage.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const instances = ref<Awaited<ReturnType<typeof runtime.facade.listInstances>>>([])
const status = ref<'all' | 'active' | 'pending_review' | 'rejected' | 'disabled'>('all')
const visibility = ref<'all' | 'public' | 'private'>('all')

function nameOf(suffix: string) {
  return `${runtime.routePrefix}-${suffix}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    instances.value = await runtime.facade.listInstances(status.value === 'all' ? undefined : { status: status.value })
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

const filteredInstances = computed(() => {
  return instances.value.filter((instance) => {
    if (visibility.value === 'all') return true
    return (instance.visibility || '').toLowerCase() === visibility.value
  })
})

function ownerLabelOf(instance: (typeof instances.value)[number]) {
  return instance.ownerName || instance.ownerID || instance.ownerId || '-'
}

function statusClassOf(instance: (typeof instances.value)[number]) {
  switch (instance.status) {
    case 'active':
      return 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100'
    case 'pending_review':
      return 'border-amber-400/25 bg-amber-500/10 text-amber-100'
    case 'rejected':
      return 'border-rose-400/25 bg-rose-500/10 text-rose-100'
    default:
      return 'border-white/10 bg-black/20 text-slate-300'
  }
}

onMounted(load)
</script>

<template>
  <BundlePage data-test-id="remote-task-management.instances.page" title="Connector Instances">
    <template #actions>
      <button class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]" @click="load">Refresh</button>
      <select
        v-model="status"
        data-test-id="remote-task-management.instances.status"
        class="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 outline-none transition hover:border-white/20"
        @change="load"
      >
        <option class="bg-slate-950 text-slate-100" value="all">All Status</option>
        <option class="bg-slate-950 text-slate-100" value="active">Active</option>
        <option class="bg-slate-950 text-slate-100" value="pending_review">Pending Review</option>
        <option class="bg-slate-950 text-slate-100" value="rejected">Rejected</option>
        <option class="bg-slate-950 text-slate-100" value="disabled">Disabled</option>
      </select>
      <select
        v-model="visibility"
        data-test-id="remote-task-management.instances.visibility"
        class="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 outline-none transition hover:border-white/20"
      >
        <option class="bg-slate-950 text-slate-100" value="all">All Visibility</option>
        <option class="bg-slate-950 text-slate-100" value="public">Public</option>
        <option class="bg-slate-950 text-slate-100" value="private">Private</option>
      </select>
    </template>

    <BundleState v-if="loading" variant="loading" message="Loading instances..." />
    <BundleState v-else-if="error" variant="error" :message="error" action-label="Refresh" @action="load" />
    <div v-else-if="!filteredInstances.length" class="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-6 py-10 text-center">
      <div class="text-lg font-semibold text-white">No instances found</div>
    </div>
    <div v-else class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <table data-test-id="remote-task-management.instances.table" class="min-w-full bg-transparent">
        <thead class="bg-white/[0.02] text-left text-sm text-slate-400">
          <tr>
            <th class="px-4 py-3 font-medium">Instance</th>
            <th class="px-4 py-3 font-medium">Package</th>
            <th class="px-4 py-3 font-medium">Owner</th>
            <th class="px-4 py-3 font-medium">Visibility</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Version</th>
            <th class="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
          v-for="instance in filteredInstances"
          :key="instance.id"
          :data-test-id="`remote-task-management.instances.row.${instance.id}`"
          class="cursor-pointer border-t border-white/10 transition hover:bg-white/[0.04]"
        >
            <td class="px-4 py-4" @click="detail(instance.id)">
              <div class="font-medium text-white">{{ instance.name || instance.id }}</div>
              <div class="text-sm leading-6 text-slate-400">{{ instance.instance_description || '-' }}</div>
            </td>
            <td class="px-4 py-4 text-slate-300">{{ instance.pkgName || instance.pkgID || '-' }}</td>
            <td class="px-4 py-4 text-slate-300">{{ ownerLabelOf(instance) }}</td>
            <td class="px-4 py-4 text-slate-300">{{ instance.visibility || '-' }}</td>
            <td class="px-4 py-4">
              <span class="rounded-full border px-3 py-1 text-xs font-medium" :class="statusClassOf(instance)">
                {{ instance.status || 'unknown' }}
              </span>
            </td>
            <td class="px-4 py-4 text-slate-300">{{ instance.activeVersion || '-' }}</td>
            <td class="px-4 py-4">
              <button class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]" @click="detail(instance.id)">Details</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </BundlePage>
</template>
