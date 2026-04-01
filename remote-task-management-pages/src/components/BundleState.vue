<script setup lang="ts">
import { Badge, Button, Card, CardContent, Skeleton } from '@mcplinx/ui-vue'

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
      return 'border-rose-600/30 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100'
    case 'empty':
      return 'border-border border-dashed bg-muted/30 text-muted-foreground'
    default:
      return 'border-border bg-muted/20 text-muted-foreground'
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
  <div v-if="variant === 'loading'" :data-test-id="dataTestId" class="space-y-4">
    <Skeleton class="h-8 w-[250px] bg-muted" />
    <Skeleton class="h-[125px] w-full rounded-2xl bg-muted" />
    <div class="space-y-2">
      <Skeleton class="h-4 w-[250px] bg-muted" />
      <Skeleton class="h-4 w-[200px] bg-muted" />
    </div>
  </div>
  <Card
    v-else
    :data-test-id="dataTestId"
    class="rounded-2xl text-sm"
    :class="paletteOf(variant)"
  >
    <CardContent class="flex flex-col gap-3 px-5 py-6 md:flex-row md:items-center md:justify-between">
      <div class="space-y-3">
        <Badge :variant="badgeVariantOf(variant)" class="uppercase tracking-wide">
          {{ variant }}
        </Badge>
        <p class="leading-6 text-inherit">{{ message }}</p>
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
