<script setup lang="ts">
import { Card, CardContent } from '@mcplinx/ui-vue'

withDefaults(
  defineProps<{
    /** No outer Card chrome — use inside dashboard hosts that already provide a content surface. */
    plain?: boolean
  }>(),
  { plain: false },
)
</script>

<template>
  <div v-if="plain" class="text-foreground">
    <slot />
  </div>
  <Card v-else class="rounded-2xl text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
    <CardContent class="p-4 md:p-5">
      <slot />
    </CardContent>
  </Card>
</template>
