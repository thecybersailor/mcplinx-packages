<script setup lang="ts">
import { Badge, Button, Card, CardContent } from '@mcplinx/ui-vue'

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
      return 'border-rose-500/30 bg-rose-500/10 text-rose-100'
    case 'empty':
      return 'border-white/12 border-dashed bg-white/[0.02] text-slate-300'
    default:
      return 'border-white/10 bg-white/[0.03] text-slate-300'
  }
}

function badgeVariantOf(variant: typeof props.variant) {
  switch (variant) {
    case 'error':
      return 'destructive'
    case 'empty':
      return 'outline'
    default:
      return 'secondary'
  }
}
</script>

<template>
  <Card
    :data-test-id="dataTestId"
    class="rounded-2xl text-sm"
    :class="paletteOf(variant)"
  >
    <CardContent class="flex flex-col gap-3 px-5 py-6 md:flex-row md:items-center md:justify-between">
      <div class="space-y-3">
        <Badge :variant="badgeVariantOf(variant)" class="uppercase tracking-wide">
          {{ variant }}
        </Badge>
        <p class="leading-6">{{ message }}</p>
      </div>
      <Button
        v-if="actionLabel"
        variant="outline"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </Button>
    </CardContent>
  </Card>
</template>
