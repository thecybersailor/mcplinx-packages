<script setup lang="ts">
import { Button, Skeleton } from '@mcplinx/ui-vue'

const props = defineProps<{
  variant: 'loading' | 'error' | 'empty'
  message: string
  actionLabel?: string
  dataTestId?: string
}>()

const emit = defineEmits<{
  action: []
}>()

function paletteOf(variant: typeof props.variant) {
  switch (variant) {
    case 'error':
      return 'border-rose-200 bg-rose-50 text-rose-700'
    case 'empty':
      return 'border-slate-200 border-dashed bg-slate-50 text-slate-500'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-500'
  }
}
</script>

<template>
  <div v-if="variant === 'loading'" :data-test-id="dataTestId" class="space-y-4">
    <Skeleton class="h-8 w-[250px]" />
    <Skeleton class="h-[125px] w-full rounded-xl" />
    <div class="space-y-2">
      <Skeleton class="h-4 w-[250px]" />
      <Skeleton class="h-4 w-[200px]" />
    </div>
  </div>
  <div
    v-else
    :data-test-id="dataTestId"
    class="rounded-2xl border px-5 py-6 text-sm"
    :class="paletteOf(variant)"
  >
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p class="leading-6">{{ message }}</p>
      <Button
        v-if="actionLabel"
        type="button"
        variant="outline"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </Button>
    </div>
  </div>
</template>
