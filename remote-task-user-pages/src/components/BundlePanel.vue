<script setup lang="ts">
import { Card, CardContent } from '@mcplinx/ui-vue'
</script>

<template>
  <Card class="bg-muted/30 shadow-none">
    <CardContent class="p-4 md:p-5">
      <slot />
    </CardContent>
  </Card>
</template>
