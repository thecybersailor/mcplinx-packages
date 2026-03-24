<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  dataTestId?: string
  dark?: boolean
}>(), {
  dark: false,
})
</script>

<template>
  <section
    :data-test-id="dataTestId"
    :class="[
      'space-y-6 rounded-[28px] p-6 md:p-8',
      dark
        ? 'border border-white/10 bg-white/[0.03] text-slate-100 shadow-[0_18px_50px_rgba(2,6,23,0.24)] backdrop-blur-sm'
        : 'border border-slate-200 bg-white text-slate-950 shadow-[0_18px_50px_rgba(15,23,42,0.08)]',
    ]"
  >
    <header class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-2">
        <h1 class="text-3xl font-semibold tracking-tight" :class="dark ? 'text-white' : 'text-slate-950'">{{ title }}</h1>
        <p v-if="description" class="max-w-3xl text-sm leading-6" :class="dark ? 'text-slate-400' : 'text-slate-500'">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <slot />
  </section>
</template>
