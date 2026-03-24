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
      return 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
    case 'outline':
      return 'border border-white/12 bg-white/[0.04] text-slate-100 hover:border-white/20 hover:bg-white/[0.08]'
    case 'secondary':
      return 'border border-white/12 bg-white/[0.04] text-slate-100 hover:border-white/20 hover:bg-white/[0.08]'
    case 'destructive':
      return 'border border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20'
    default:
      return 'bg-white text-slate-950 hover:bg-slate-200'
  }
})
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-60',
      variantClass,
      props.class,
    ]"
  >
    <slot />
  </button>
</template>
