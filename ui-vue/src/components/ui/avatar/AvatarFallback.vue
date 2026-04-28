<script setup lang="ts">
import type { AvatarFallbackProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { AvatarFallback, useForwardProps } from "reka-ui"
import { reactiveOmit } from "@vueuse/core"
import { cn } from "../../lib/utils"

interface Props extends /* @vue-ignore */ AvatarFallbackProps {
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()

const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AvatarFallback
    v-bind="forwarded"
    :class="cn('flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground', props.class)"
  >
    <slot />
  </AvatarFallback>
</template>
