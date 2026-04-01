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
  <div
    v-if="borderless"
    :data-test-id="dataTestId"
    class="space-y-6 text-foreground"
  >
    <CardHeader class="border-b-0 px-0 py-0">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <CardTitle class="text-3xl font-semibold tracking-tight text-foreground">{{ title }}</CardTitle>
          <CardDescription v-if="description" class="max-w-3xl leading-6 text-muted-foreground">
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
  </div>

  <Card
    v-else
    :data-test-id="dataTestId"
    class="space-y-6 rounded-[28px] border border-border bg-card p-6 text-foreground shadow-sm md:p-8"
  >
    <CardHeader class="border-b-0 px-0 py-0">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <CardTitle class="text-3xl font-semibold tracking-tight text-foreground">{{ title }}</CardTitle>
          <CardDescription v-if="description" class="max-w-3xl leading-6 text-muted-foreground">
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
