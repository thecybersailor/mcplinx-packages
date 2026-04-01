<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <section
    data-slot="card"
    :class="['rounded-lg border border-border bg-card text-card-foreground shadow-sm', props.class]"
  >
    <slot />
  </section>
</template>
