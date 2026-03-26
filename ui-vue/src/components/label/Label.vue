<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
  for?: string
}>()
</script>

<template>
  <label :for="props.for" :class="['text-sm', props.class]">
    <slot />
  </label>
</template>
