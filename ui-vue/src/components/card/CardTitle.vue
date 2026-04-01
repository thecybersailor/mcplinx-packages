<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <h2
    data-slot="card-title"
    :class="['text-lg font-semibold text-foreground', props.class]"
  >
    <slot />
  </h2>
</template>
