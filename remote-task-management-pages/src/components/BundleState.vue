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
      return 'border-rose-200 bg-rose-50 text-rose-700'
    case 'empty':
      return 'border-slate-200 border-dashed bg-slate-50 text-slate-500'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-500'
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
        class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>
