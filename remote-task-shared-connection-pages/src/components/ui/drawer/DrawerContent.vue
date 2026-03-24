<script lang="ts" setup>
import type { DialogContentEmits, DialogContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { useForwardPropsEmits } from "reka-ui"
import { DrawerContent, DrawerPortal } from "vaul-vue"
import { cn } from "../lib/utils"
import DrawerOverlay from "./DrawerOverlay.vue"

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<DialogContentProps & { class?: HTMLAttributes["class"] }>()
const emits = defineEmits<DialogContentEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerContent
      data-slot="../drawer-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(
        '../drawer-content bg-background fixed z-50 flex h-auto flex-col',
        '../drawer-direction=top]:rounded-b-lg',
        '../drawer-direction=bottom]:rounded-t-lg',
        '../drawer-direction=right]:sm:max-w-sm',
        '../drawer-direction=left]:sm:max-w-sm',
        props.class,
      )"
    >
      <div class="../drawer-content:block" />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
