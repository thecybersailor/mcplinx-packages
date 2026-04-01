<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@mcplinx/ui-vue'
import { ref } from 'vue'
import ConnectorIndexCard from '../components/ConnectorIndexCard.vue'
import type { ConnectorIndexCard as ConnectorIndexCardShape } from '../types'

const copiedIndex = ref<number | null>(null)

const handleCopy = async (text: string, index: number) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'absolute'
      textArea.style.left = '-999999px'
      document.body.prepend(textArea)
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    }
    copiedIndex.value = index
    setTimeout(() => {
      if (copiedIndex.value === index) {
        copiedIndex.value = null
      }
    }, 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}

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
    class="space-y-6 rounded-[28px] border border-white/10 bg-transparent p-6 text-slate-100 shadow-none md:p-10 lg:p-12 xl:space-y-8"
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
        <div class="grid gap-4 md:grid-cols-2 lg:gap-6">
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
        <Card class="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 text-slate-100 shadow-xl">
          <!-- macOS terminal style header -->
          <div class="flex items-center border-b border-white/10 bg-zinc-900/50 px-4 py-3">
            <div class="mr-4 flex gap-2">
              <div class="h-3 w-3 rounded-full bg-rose-500/80"></div>
              <div class="h-3 w-3 rounded-full bg-amber-500/80"></div>
              <div class="h-3 w-3 rounded-full bg-emerald-500/80"></div>
            </div>
            <h3 v-if="cliHintTitle" class="text-sm font-medium tracking-wide text-slate-300">{{ cliHintTitle }}</h3>
          </div>
          <CardContent class="space-y-4 p-5 md:p-6">
            <p v-if="cliHintDescription" class="text-sm leading-6 text-slate-400">{{ cliHintDescription }}</p>
            <div v-if="cliCommands.length" class="space-y-3">
              <div 
                v-for="(command, index) in cliCommands" 
                :key="command"
                class="group relative flex items-center justify-between overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs leading-6 text-slate-300 transition-colors hover:bg-white/[0.04]"
              >
                <div class="flex items-center gap-4 overflow-x-auto pr-12">
                  <span class="select-none font-mono text-slate-600">{{ index + 1 }}</span>
                  <code class="whitespace-nowrap font-mono">{{ command }}</code>
                </div>
                <button
                  type="button"
                  class="absolute right-3 rounded-md p-1.5 text-slate-500 opacity-0 transition-all hover:bg-white/10 hover:text-slate-100 focus:opacity-100 group-hover:opacity-100"
                  @click="handleCopy(command, index)"
                  :title="copiedIndex === index ? 'Copied!' : 'Copy to clipboard'"
                >
                  <svg v-if="copiedIndex === index" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </slot>
    </CardContent>
  </Card>
</template>
