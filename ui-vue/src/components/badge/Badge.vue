<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'outline' | 'secondary' | 'destructive'
  class?: HTMLAttributes['class']
}>(), {
  variant: 'default',
  class: undefined,
})

const variantClass = computed(() => {
  switch (props.variant) {
    case 'outline':
      return 'border-border text-foreground'
    case 'secondary':
      return 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
    case 'destructive':
      return 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80'
    default:
      return 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'
  }
})
</script>

<template>
  <span :class="['inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium', variantClass, props.class]">
    <slot />
  </span>
</template>
