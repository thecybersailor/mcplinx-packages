<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { RemoteTaskConnectionActionDetail } from '../facade'
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Textarea,
} from '@mcplinx/ui-vue'

const props = withDefaults(defineProps<{
  open: boolean
  loading?: boolean
  submitting?: boolean
  detail: RemoteTaskConnectionActionDetail | null
  error?: string
  result?: Record<string, unknown> | null
  dataTestIdPrefix: string
}>(), {
  loading: false,
  submitting: false,
  detail: null,
  error: '',
  result: null,
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  submit: [payload: Record<string, unknown>]
}>()

const formState = reactive<Record<string, unknown>>({})
const rawInput = ref('{}')

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

const schema = computed(() => {
  const detail = asRecord(props.detail)
  return (
    asRecord(detail?.input_schema) ??
    asRecord(detail?.inputSchema) ??
    asRecord(detail?.param_schema) ??
    asRecord(detail?.parameters_schema)
  )
})

const requiredKeys = computed(() => {
  const required = schema.value?.required
  return new Set(Array.isArray(required) ? required.map((entry) => String(entry)) : [])
})

const fields = computed(() => {
  const properties = asRecord(schema.value?.properties)
  if (!properties) return []
  return Object.entries(properties).map(([key, value]) => ({
    key,
    schema: asRecord(value) ?? {},
  }))
})

const runnerTitle = computed(() => {
  const detail = asRecord(props.detail)
  return String(detail?.name ?? detail?.title ?? detail?.key ?? detail?.action_key ?? 'Run Tool')
})

function defaultValueForField(fieldSchema: Record<string, unknown>): unknown {
  if (Object.prototype.hasOwnProperty.call(fieldSchema, 'default')) return fieldSchema.default
  if (fieldSchema.type === 'boolean') return 'false'
  if (fieldSchema.type === 'object' || fieldSchema.type === 'array') return '{}'
  return ''
}

function resetForm() {
  for (const key of Object.keys(formState)) {
    delete formState[key]
  }
  for (const field of fields.value) {
    formState[field.key] = defaultValueForField(field.schema)
  }
  rawInput.value = '{}'
}

watch(() => props.detail, resetForm, { immediate: true })

function fieldType(fieldSchema: Record<string, unknown>): string {
  return String(fieldSchema.type ?? 'string')
}

function fieldLabel(key: string, fieldSchema: Record<string, unknown>): string {
  return String(fieldSchema.title ?? fieldSchema.label ?? key)
}

function fieldDescription(fieldSchema: Record<string, unknown>): string {
  return String(fieldSchema.description ?? '')
}

function fieldEnum(fieldSchema: Record<string, unknown>): string[] {
  const choices = fieldSchema.enum
  return Array.isArray(choices) ? choices.map((entry) => String(entry)) : []
}

function parseFieldValue(fieldSchema: Record<string, unknown>, rawValue: unknown): unknown {
  const type = fieldType(fieldSchema)
  if (type === 'boolean') return rawValue === true || rawValue === 'true'
  if (type === 'number' || type === 'integer') return rawValue === '' ? undefined : Number(rawValue)
  if (type === 'object' || type === 'array') {
    if (typeof rawValue === 'string' && rawValue.trim()) {
      return JSON.parse(rawValue)
    }
    return type === 'array' ? [] : {}
  }
  return rawValue
}

function buildInput() {
  if (fields.value.length === 0) {
    const trimmed = rawInput.value.trim()
    return trimmed ? JSON.parse(trimmed) : {}
  }

  const input: Record<string, unknown> = {}
  for (const field of fields.value) {
    const rawValue = formState[field.key]
    const required = requiredKeys.value.has(field.key)
    if (!required && (rawValue === '' || rawValue === undefined || rawValue === null)) {
      continue
    }
    input[field.key] = parseFieldValue(field.schema, rawValue)
  }
  return input
}

function handleSubmit() {
  emit('submit', { input: buildInput() })
}

const prettyResult = computed(() => {
  if (!props.result) return ''
  return JSON.stringify(props.result, null, 2)
})

</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="right"
      class="sm:max-w-xl"
      :data-test-id="dataTestIdPrefix"
    >
      <SheetHeader>
        <SheetTitle>{{ runnerTitle }}</SheetTitle>
        <SheetDescription>Review the input schema and run this tool against the current connection.</SheetDescription>
      </SheetHeader>

      <div class="mt-4 space-y-4">
        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        <p v-if="loading" class="text-sm text-muted-foreground">Loading tool schema...</p>

        <form
          v-else
          class="space-y-4"
          :data-test-id="`${dataTestIdPrefix}.submit`"
          @submit.prevent="handleSubmit"
        >
          <template v-if="fields.length > 0">
            <div v-for="field in fields" :key="field.key" class="space-y-2">
              <Label :for="`${dataTestIdPrefix}.field.${field.key}`">{{ fieldLabel(field.key, field.schema) }}</Label>
              <p v-if="fieldDescription(field.schema)" class="text-xs text-muted-foreground">{{ fieldDescription(field.schema) }}</p>

              <Select
                v-if="fieldType(field.schema) === 'boolean' || fieldEnum(field.schema).length > 0"
                v-model="formState[field.key] as string"
              >
                <SelectTrigger :data-test-id="`${dataTestIdPrefix}.field.${field.key}`">
                  <SelectValue :placeholder="fieldLabel(field.key, field.schema)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="choice in (fieldEnum(field.schema).length > 0 ? fieldEnum(field.schema) : ['true', 'false'])"
                    :key="choice"
                    :value="choice"
                  >
                    {{ choice }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Textarea
                v-else-if="fieldType(field.schema) === 'object' || fieldType(field.schema) === 'array'"
                :id="`${dataTestIdPrefix}.field.${field.key}`"
                v-model="formState[field.key] as string"
                rows="5"
                :data-test-id="`${dataTestIdPrefix}.field.${field.key}`"
              />

              <Input
                v-else
                :id="`${dataTestIdPrefix}.field.${field.key}`"
                v-model="formState[field.key] as string"
                :type="fieldType(field.schema) === 'number' || fieldType(field.schema) === 'integer' ? 'number' : 'text'"
                :data-test-id="`${dataTestIdPrefix}.field.${field.key}`"
              />
            </div>
          </template>

          <div v-else class="space-y-2">
            <Label :for="`${dataTestIdPrefix}.field.raw`">Input JSON</Label>
            <Textarea
              :id="`${dataTestIdPrefix}.field.raw`"
              v-model="rawInput"
              rows="8"
              :data-test-id="`${dataTestIdPrefix}.field.raw`"
            />
          </div>

          <div class="flex justify-end">
            <Button type="submit" :disabled="submitting">
              {{ submitting ? 'Running...' : 'Run Tool' }}
            </Button>
          </div>
        </form>

        <div v-if="prettyResult" class="space-y-2 border-t border-border pt-4">
          <Label :for="`${dataTestIdPrefix}.result`">Execution Result</Label>
          <pre
            :id="`${dataTestIdPrefix}.result`"
            class="max-h-72 overflow-auto rounded-md border border-border bg-muted/20 p-3 text-xs text-foreground"
            :data-test-id="`${dataTestIdPrefix}.result`"
          >{{ prettyResult }}</pre>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
