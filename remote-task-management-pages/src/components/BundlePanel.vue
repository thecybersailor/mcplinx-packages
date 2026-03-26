<script setup lang="ts">
import { Card, CardContent } from '@mcplinx/ui-vue'
</script>

<template>
  <Card class="rounded-2xl text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
    <CardContent class="p-4 md:p-5">
      <slot />
    </CardContent>
  </Card>
</template>
