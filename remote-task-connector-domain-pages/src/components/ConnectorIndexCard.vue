<script setup lang="ts">
import { Button, Card, CardContent } from '@mcplinx/ui-vue'
import type { ConnectorIndexCard as ConnectorIndexCardShape } from '../types'

defineProps<{
  card: ConnectorIndexCardShape
}>()
</script>

<template>
  <Card class="rounded-2xl border border-white/10 bg-white/[0.03] text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
    <CardContent class="space-y-4 p-5 md:p-6">
      <div class="space-y-2">
        <h2 class="text-lg font-semibold text-white">{{ card.title }}</h2>
        <p v-if="card.description" class="text-sm leading-6 text-slate-400">{{ card.description }}</p>
      </div>

      <div v-if="card.stats?.length" class="space-y-1 text-sm text-slate-300">
        <div
          v-for="stat in card.stats"
          :key="stat.label"
          class="flex items-center gap-2"
        >
          <span class="text-slate-400">{{ stat.label }}:</span>
          <span class="font-medium text-white">{{ stat.value }}</span>
        </div>
      </div>

      <Button
        v-if="card.actionLabel && card.to"
        as-child
        variant="outline"
        class="w-fit"
      >
        <RouterLink :to="card.to" :data-test-id="`connector-index.card.${card.id}.action`">
          {{ card.actionLabel }}
        </RouterLink>
      </Button>
    </CardContent>
  </Card>
</template>
