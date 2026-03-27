<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@mcplinx/ui-vue'
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
  <Card
    data-test-id="connector-index.page"
    class="space-y-6 rounded-[28px] border border-white/10 bg-transparent p-6 text-slate-100 shadow-none md:p-8"
  >
    <CardHeader class="border-b-0 px-0 py-0">
      <slot name="header">
        <div class="space-y-2">
          <CardTitle class="text-3xl font-semibold tracking-tight text-white">{{ title }}</CardTitle>
          <CardDescription v-if="description" class="max-w-3xl leading-6 text-slate-400">
            {{ description }}
          </CardDescription>
        </div>
      </slot>
    </CardHeader>

    <CardContent class="space-y-4 px-0 py-0">
      <div v-if="loading" class="space-y-4" data-test-id="connector-index.loading">
        <Skeleton class="h-8 w-[250px] bg-white/10" />
        <Skeleton class="h-[125px] w-full rounded-2xl bg-white/10" />
      </div>

      <div v-else-if="error" data-test-id="connector-index.error" class="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-6 text-sm text-rose-100">
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
        <Card class="rounded-2xl border border-white/10 bg-black/20 text-slate-100">
          <CardContent class="space-y-4 p-5 md:p-6">
            <div class="space-y-2">
              <h3 v-if="cliHintTitle" class="text-sm font-semibold text-white">{{ cliHintTitle }}</h3>
              <p v-if="cliHintDescription" class="text-sm leading-6 text-slate-400">{{ cliHintDescription }}</p>
            </div>
            <div v-if="cliCommands.length" class="space-y-3 text-xs leading-6 text-slate-300">
              <pre v-for="command in cliCommands" :key="command" class="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-3"><code>{{ command }}</code></pre>
            </div>
          </CardContent>
        </Card>
      </slot>
    </CardContent>
  </Card>
</template>
