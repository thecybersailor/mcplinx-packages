import type { RemoteTaskExecution } from '../facade'

export type NormalizedTaskExecution = {
  id: string
  status: string
  actionKey: string
  actionName: string
  connectorKey: string
  connectionId: string
  createdAt: string
  startedAt: string
  finishedAt: string
  externalTaskId: string
  taskInfoURL: string
  input: Record<string, unknown> | null
  output: Record<string, unknown> | null
  error: Record<string, unknown> | null
  raw: RemoteTaskExecution
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function pickRecord(...values: unknown[]): Record<string, unknown> | null {
  for (const value of values) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
  }
  return null
}

function packageNameFromTask(task: RemoteTaskExecution): string {
  const pkg = task.package
  if (pkg && typeof pkg === 'object' && !Array.isArray(pkg)) {
    const packageMap = pkg as Record<string, unknown>
    return pickString(packageMap.name, packageMap.id, packageMap.source_id, packageMap.sourceID)
  }
  return ''
}

export function normalizeTaskExecution(task: RemoteTaskExecution | null | undefined): NormalizedTaskExecution {
  const row = (task ?? {}) as RemoteTaskExecution
  return {
    id: pickString(row.id),
    status: pickString(row.status).toUpperCase(),
    actionKey: pickString(row.action_key, row.actionKey),
    actionName: pickString(row.action_name, row.actionName, row.action_key, row.actionKey),
    connectorKey: pickString(
      packageNameFromTask(row),
      row.connector_key,
      row.connectorKey,
      row.connection_id,
      row.connectionId,
    ),
    connectionId: pickString(row.connection_id, row.connectionId),
    createdAt: pickString(row.created_at, row.createdAt),
    startedAt: pickString(row.started_at, row.startedAt),
    finishedAt: pickString(row.finished_at, row.finishedAt),
    externalTaskId: pickString(row.external_task_id, row.externalTaskId),
    taskInfoURL: pickString(row.task_info_url, row.taskInfoUrl),
    input: pickRecord(row.input),
    output: pickRecord(row.output, row.result),
    error: pickRecord(row.error),
    raw: row,
  }
}

export function isRunningTaskStatus(status: string | null | undefined): boolean {
  switch (String(status ?? '').trim().toUpperCase()) {
    case 'CREATED':
    case 'PENDING':
    case 'QUEUED':
    case 'RUNNING':
    case 'IN_PROGRESS':
      return true
    default:
      return false
  }
}

export function taskStatusVariant(status: string | null | undefined): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (String(status ?? '').trim().toUpperCase()) {
    case 'SUCCEEDED':
    case 'COMPLETED':
      return 'default'
    case 'FAILED':
      return 'destructive'
    case 'PENDING':
    case 'RUNNING':
    case 'QUEUED':
    case 'CREATED':
    case 'IN_PROGRESS':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function taskStatusText(status: string | null | undefined, t: (key: string, fallback: string) => string): string {
  switch (String(status ?? '').trim().toUpperCase()) {
    case 'PENDING':
      return t('remoteTaskUser.tasks.status.pending', 'Pending')
    case 'RUNNING':
      return t('remoteTaskUser.tasks.status.running', 'Running')
    case 'IN_PROGRESS':
      return t('remoteTaskUser.tasks.status.running', 'Running')
    case 'QUEUED':
      return t('remoteTaskUser.tasks.status.queued', 'Queued')
    case 'CREATED':
      return t('remoteTaskUser.tasks.status.created', 'Created')
    case 'SUCCEEDED':
      return t('remoteTaskUser.tasks.status.succeeded', 'Succeeded')
    case 'COMPLETED':
      return t('remoteTaskUser.tasks.status.completed', 'Completed')
    case 'FAILED':
      return t('remoteTaskUser.tasks.status.failed', 'Failed')
    case 'CANCELLED':
      return t('remoteTaskUser.tasks.status.cancelled', 'Cancelled')
    default:
      return String(status ?? '-').trim() || '-'
  }
}

export function taskBadgeClass(status: string | null | undefined): string {
  switch (String(status ?? '').trim().toUpperCase()) {
    case 'SUCCEEDED':
    case 'COMPLETED':
      return 'text-emerald-600'
    case 'FAILED':
      return 'text-rose-600'
    case 'PENDING':
    case 'RUNNING':
    case 'QUEUED':
    case 'CREATED':
    case 'IN_PROGRESS':
      return 'text-amber-500'
    case 'CANCELLED':
      return 'text-slate-500'
    default:
      return 'text-slate-500'
  }
}

export function formatTaskDate(value: string | null | undefined): string {
  const raw = String(value ?? '').trim()
  if (!raw) return '-'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString()
}

export function taskAvatarText(task: NormalizedTaskExecution): string {
  const source = task.connectorKey || task.actionName || task.id
  if (!source) return '?'
  return source.trim().slice(0, 1).toUpperCase()
}
