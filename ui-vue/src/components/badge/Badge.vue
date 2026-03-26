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
      return 'border-white/10 bg-black/20 text-slate-300'
    case 'secondary':
      return 'border-amber-400/20 bg-amber-500/10 text-amber-100'
    case 'destructive':
      return 'border-rose-400/20 bg-rose-500/10 text-rose-100'
    default:
      return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
  }
})
</script>

<template>
  <span :class="['inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium', variantClass, props.class]">
    <slot />
  </span>
</template>
