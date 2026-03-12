<script setup lang="ts">
const props = defineProps<{
  variant: 'loading' | 'error' | 'empty'
  message: string
  actionLabel?: string
  dataTestId?: string
}>()

const emit = defineEmits<{
  action: []
}>()

function paletteOf(variant: typeof props.variant) {
  switch (variant) {
    case 'error':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-100'
    case 'empty':
      return 'border-white/12 border-dashed bg-white/[0.02] text-slate-300'
    default:
      return 'border-white/10 bg-white/[0.03] text-slate-300'
  }
}
</script>

<template>
  <div
    :data-test-id="dataTestId"
    class="rounded-2xl border px-5 py-6 text-sm"
    :class="paletteOf(variant)"
  >
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p class="leading-6">{{ message }}</p>
      <button
        v-if="actionLabel"
        type="button"
        class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>
