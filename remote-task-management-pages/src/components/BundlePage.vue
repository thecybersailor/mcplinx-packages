<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  dataTestId?: string
  borderless?: boolean
}>(), {
  borderless: false,
})
</script>

<template>
  <section
    :data-test-id="dataTestId"
    :class="[
      'space-y-6 rounded-[28px] p-6 text-slate-100 md:p-8',
      borderless
        ? 'border border-transparent bg-transparent shadow-none'
        : 'border border-white/10 bg-white/[0.03] shadow-[0_18px_50px_rgba(2,6,23,0.24)] backdrop-blur-sm',
    ]"
  >
    <header class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-2">
        <h1 class="text-3xl font-semibold tracking-tight text-white">{{ title }}</h1>
        <p v-if="description" class="max-w-3xl text-sm leading-6 text-slate-400">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <slot />
  </section>
</template>
