<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <section
    data-slot="card"
    :class="['rounded-lg border border-white/10 bg-white/[0.03]', props.class]"
  >
    <slot />
  </section>
</template>
