<script setup lang="ts">
const props = withDefaults(defineProps<{
  iconURL?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'md',
})

const sizeClassMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
}
</script>

<template>
  <div :class="['relative flex shrink-0 items-center justify-center overflow-hidden rounded bg-muted', sizeClassMap[size]]">
    <img v-if="iconURL" :src="iconURL" alt="Connector Icon" class="h-full w-full object-cover">
    <div v-else class="flex h-full w-full items-center justify-center text-muted-foreground">?</div>
  </div>
</template>
