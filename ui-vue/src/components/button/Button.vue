<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost'
  class?: HTMLAttributes['class']
  disabled?: boolean
}>(), {
  variant: 'default',
  class: undefined,
  disabled: false,
})

const variantClass = computed(() => {
  switch (props.variant) {
    case 'ghost':
      return 'hover:bg-accent hover:text-accent-foreground'
    case 'outline':
      return 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
    case 'secondary':
      return 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
    case 'destructive':
      return 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    default:
      return 'bg-primary text-primary-foreground hover:bg-primary/90'
  }
})
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      variantClass,
      props.class,
    ]"
  >
    <slot />
  </button>
</template>
