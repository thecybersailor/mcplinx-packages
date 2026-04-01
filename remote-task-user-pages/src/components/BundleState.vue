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
      return 'border-destructive/30 bg-destructive/10 text-destructive'
    case 'empty':
      return 'border-border border-dashed bg-muted/30 text-muted-foreground'
    default:
      return 'border-border bg-muted/30 text-muted-foreground'
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
