<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="card-header"
    :class="['border-b border-border px-6 py-4', props.class]"
  >
    <slot />
  </div>
</template>
