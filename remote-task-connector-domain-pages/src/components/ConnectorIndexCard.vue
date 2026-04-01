<script setup lang="ts">
import { Button, Card, CardContent } from '@mcplinx/ui-vue'
import type { ConnectorIndexCard as ConnectorIndexCardShape } from '../types'

defineProps<{
  card: ConnectorIndexCardShape
}>()
</script>

<template>
  <Card class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
    <CardContent class="space-y-4 p-5 md:p-6">
      <div class="space-y-2">
        <h2 class="text-lg font-semibold text-foreground">{{ card.title }}</h2>
        <p v-if="card.description" class="text-sm leading-6 text-muted-foreground">{{ card.description }}</p>
      </div>

      <div v-if="card.stats?.length" class="space-y-1 text-sm">
        <div
          v-for="stat in card.stats"
          :key="stat.label"
          class="flex items-center gap-2"
        >
          <span class="text-muted-foreground">{{ stat.label }}:</span>
          <span class="font-medium tabular-nums text-foreground">{{ stat.value }}</span>
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
