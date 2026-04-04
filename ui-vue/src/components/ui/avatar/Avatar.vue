<script setup lang="ts">
import type { AvatarRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { AvatarRoot, useForwardProps } from "reka-ui"
import { reactiveOmit } from "@vueuse/core"
import { cn } from "../../lib/utils"

interface AvatarProps extends AvatarRootProps {
  class?: HTMLAttributes["class"]
}

const props = defineProps<AvatarProps>()

const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AvatarRoot
    v-bind="forwarded"
    :class="cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', props.class)"
  >
    <slot />
  </AvatarRoot>
</template>
