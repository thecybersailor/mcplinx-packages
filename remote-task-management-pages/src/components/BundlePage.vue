<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@mcplinx/ui-vue'

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
  <Card
    :data-test-id="dataTestId"
    :class="[
      'space-y-6 rounded-[28px] p-6 text-slate-100 md:p-8',
      borderless
        ? 'border border-transparent bg-transparent shadow-none'
        : 'border border-white/10 bg-white/[0.03] shadow-[0_18px_50px_rgba(2,6,23,0.24)] backdrop-blur-sm',
    ]"
  >
    <CardHeader class="border-b-0 px-0 py-0">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <CardTitle class="text-3xl font-semibold tracking-tight text-white">{{ title }}</CardTitle>
          <CardDescription v-if="description" class="max-w-3xl leading-6 text-slate-400">
            {{ description }}
          </CardDescription>
        </div>
        <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
          <slot name="actions" />
        </div>
      </div>
    </CardHeader>

    <CardContent class="px-0 py-0">
      <slot />
    </CardContent>
  </Card>
</template>
