<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  dataTestId?: string
  /** @deprecated Host theme tokens drive appearance; kept for API compatibility. */
  dark?: boolean
}>(), {
  dark: false,
})
</script>

<template>
  <section
    :data-test-id="dataTestId"
    class="space-y-6 rounded-[28px] border border-border bg-card p-6 text-card-foreground shadow-sm md:p-8"
  >
    <header class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-2">
        <h1 class="text-3xl font-semibold tracking-tight text-foreground">{{ title }}</h1>
        <p v-if="description" class="max-w-3xl text-sm leading-6 text-muted-foreground">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <slot />
  </section>
</template>
