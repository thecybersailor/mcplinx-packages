<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@mcplinx/ui-vue'
import BundlePage from '../components/BundlePage.vue'
import BundlePanel from '../components/BundlePanel.vue'
import BundleState from '../components/BundleState.vue'
import { useRemoteTaskManagementRuntime } from '../facade'

const runtime = useRemoteTaskManagementRuntime()
const loading = ref(true)
const error = ref('')
type RemoteTaskInstance = Awaited<ReturnType<typeof runtime.facade.listInstances>>[number]

const instances = ref<RemoteTaskInstance[]>([])
const selectedId = ref('')
const reason = ref('')

const selected = computed<RemoteTaskInstance | null>(() => instances.value.find((item) => String(item.id ?? '') === selectedId.value) ?? null)

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
  <BundlePage data-test-id="remote-task-management.pending-instances.page" :title="runtime.t('remoteTaskManagement.pending.title', 'Pending Instances')" :description="runtime.t('remoteTaskManagement.pending.description', 'Moderation queue with the same review UI across every admin host.')">
    <BundleState v-if="loading" variant="loading" :message="runtime.t('remoteTaskManagement.common.loading', 'Loading...')" />
    <BundleState v-else-if="error" variant="error" :message="error" />
    <BundleState v-else-if="!instances.length" variant="empty" :message="runtime.t('remoteTaskManagement.pending.empty', 'No pending instances.')" />
    <div v-else class="grid gap-4 lg:grid-cols-[2fr,1fr]">
      <div class="overflow-hidden rounded-2xl border border-border">
        <Table data-test-id="remote-task-management.pending.table">
          <TableHeader class="bg-muted/40"><TableRow class="border-border hover:bg-transparent"><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.name', 'Name') }}</TableHead><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.status', 'Status') }}</TableHead><TableHead class="text-muted-foreground">{{ runtime.t('remoteTaskManagement.common.select', 'Select') }}</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow v-for="instance in instances" :key="instance.id" class="border-border hover:bg-muted/30">
              <TableCell class="text-foreground">{{ instance.name || instance.id }}</TableCell>
              <TableCell class="text-muted-foreground">{{ instance.status || '-' }}</TableCell>
              <TableCell>
                <Button :data-test-id="`remote-task-management.pending.select.${instance.id}`" variant="outline" size="sm" @click="selectedId = String(instance.id)">{{ runtime.t('remoteTaskManagement.common.select', 'Select') }}</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <BundlePanel>
        <h2 class="mb-3 text-base font-semibold text-foreground">{{ runtime.t('remoteTaskManagement.pending.review', 'Review') }}</h2>
        <p class="mb-3 text-sm leading-6 text-muted-foreground">{{ selected?.name || runtime.t('remoteTaskManagement.pending.chooseInstance', 'Choose an instance') }}</p>
        <textarea v-model="reason" data-test-id="remote-task-management.pending.reason" class="mb-3 min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground" />
        <div class="flex flex-wrap gap-2">
          <Button data-test-id="remote-task-management.pending.approve" :disabled="!selectedId" @click="review('approve')">{{ runtime.t('remoteTaskManagement.instances.approve', 'Approve') }}</Button>
          <Button data-test-id="remote-task-management.pending.reject" variant="destructive" :disabled="!selectedId" @click="review('reject')">{{ runtime.t('remoteTaskManagement.instances.reject', 'Reject') }}</Button>
        </div>
      </BundlePanel>
    </div>
  </BundlePage>
</template>
