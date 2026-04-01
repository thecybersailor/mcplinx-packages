<script setup lang="ts">
import { Card, CardContent, CardDescription, CardTitle, Skeleton } from '@mcplinx/ui-vue'
import ConnectorIndexCard from '../components/ConnectorIndexCard.vue'
import type { ConnectorIndexCard as ConnectorIndexCardShape } from '../types'

withDefaults(defineProps<{
  title: string
  description?: string
  cards: ConnectorIndexCardShape[]
  loading?: boolean
  error?: string
  retryLabel?: string
  cliHintTitle?: string
  cliHintDescription?: string
  cliCommands?: string[]
}>(), {
  description: undefined,
  loading: false,
  error: '',
  retryLabel: 'Retry',
  cliHintTitle: undefined,
  cliHintDescription: undefined,
  cliCommands: () => [],
})
</script>

<template>
  <!-- Plain wrapper: dashboard already provides a content surface; avoid nested card chrome. -->
  <div data-test-id="connector-index.page" class="space-y-6 text-foreground">
    <slot name="header">
      <div class="space-y-2">
        <CardTitle class="text-3xl font-semibold tracking-tight text-foreground">{{ title }}</CardTitle>
        <CardDescription v-if="description" class="max-w-3xl leading-6 text-muted-foreground">
          {{ description }}
        </CardDescription>
      </div>
    </slot>

    <div class="space-y-4">
      <div v-if="loading" class="space-y-4" data-test-id="connector-index.loading">
        <Skeleton class="h-8 w-[250px] bg-muted" />
        <Skeleton class="h-[125px] w-full rounded-2xl bg-muted" />
      </div>

      <div
        v-else-if="error"
        data-test-id="connector-index.error"
        class="rounded-2xl border border-rose-600/30 bg-rose-50 px-5 py-6 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100"
      >
        {{ error }}
      </div>

      <slot v-else name="cards">
        <div class="space-y-4">
          <template v-for="card in cards" :key="card.id">
            <slot :name="`card-${card.id}`" :card="card">
              <ConnectorIndexCard :card="card" />
            </slot>
          </template>
        </div>
      </slot>

      <slot
        v-if="cliHintTitle || cliHintDescription || cliCommands.length"
        name="cli-hint"
      >
        <Card class="rounded-2xl border border-border bg-muted/30 text-foreground">
          <CardContent class="space-y-4 p-5 md:p-6">
            <div class="space-y-2">
              <h3 v-if="cliHintTitle" class="text-sm font-semibold text-foreground">{{ cliHintTitle }}</h3>
              <p v-if="cliHintDescription" class="text-sm leading-6 text-muted-foreground">{{ cliHintDescription }}</p>
            </div>
            <div v-if="cliCommands.length" class="space-y-3 text-xs leading-6 text-foreground">
              <pre
                v-for="command in cliCommands"
                :key="command"
                class="overflow-x-auto rounded-xl border border-border bg-muted p-3"
              ><code>{{ command }}</code></pre>
            </div>
          </CardContent>
        </Card>
      </slot>
    </div>
  </div>
</template>
