<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  dataTestId?: string
}>()
</script>

<template>
  <section
    :data-test-id="dataTestId"
    class="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 text-slate-950 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-8"
  >
    <header class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-2">
        <h1 class="text-3xl font-semibold tracking-tight text-slate-950">{{ title }}</h1>
        <p v-if="description" class="max-w-3xl text-sm leading-6 text-slate-500">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <slot />
  </section>
</template>
