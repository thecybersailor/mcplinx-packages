<script setup lang="ts">
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
  <div
    :data-test-id="dataTestId"
    class="rounded-2xl border px-5 py-6 text-sm"
    :class="paletteOf(variant)"
  >
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p class="leading-6">{{ message }}</p>
      <button
        v-if="actionLabel"
        type="button"
        class="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>
