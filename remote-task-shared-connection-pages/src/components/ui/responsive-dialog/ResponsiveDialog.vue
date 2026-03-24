<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../sheet'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '../drawer'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isDesktop = useMediaQuery('(min-width: 768px)')

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}
</script>

<template>
  <!-- Desktop: Sheet from right -->
  <Sheet v-if="isDesktop" :open="open" @update:open="handleOpenChange">
    <SheetContent side="right" class="sm:max-w-[600px] overflow-y-auto p-5">
      <SheetHeader>
        <SheetTitle>
          <slot name="title" />
        </SheetTitle>
        <SheetDescription>
          <slot name="description" />
        </SheetDescription>
      </SheetHeader>
      <slot name="content" />
      <SheetFooter>
        <slot name="footer" />
      </SheetFooter>
    </SheetContent>
  </Sheet>

  <!-- Mobile/Tablet: Drawer from bottom -->
  <Drawer v-else :open="open" @update:open="handleOpenChange">
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>
          <slot name="title" />
        </DrawerTitle>
        <DrawerDescription>
          <slot name="description" />
        </DrawerDescription>
      </DrawerHeader>
      <div class="px-4">
        <slot name="content" />
      </div>
      <DrawerFooter>
        <slot name="footer" />
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>

