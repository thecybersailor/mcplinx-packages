import { inject, type InjectionKey } from 'vue'

export type ConnectionAuthTaskScope = 'platform' | 'tenant' | 'team'

export interface ConnectionAuthTaskConnectorRef {
  id?: string
  name?: string
  icon_url?: string
}

export interface ConnectionAuthTaskField {
  key?: string
  label?: string
  type?: string
  required?: boolean
  default?: unknown
  help_text?: string
}

export interface ConnectionAuthTaskDetail {
  task_id?: string
  status?: string
  scope?: ConnectionAuthTaskScope
  auth_type?: string
  connector?: ConnectionAuthTaskConnectorRef
  connection_id?: string
  connection_label?: string
  fields?: ConnectionAuthTaskField[]
  provider_url?: string
  expires_at?: string
  error_message?: string
}

export interface ConnectionAuthTaskSubmitRequest {
  auth_data?: Record<string, unknown>
}

export interface ConnectionAuthTaskCallbackRequest {
  query?: Record<string, string>
  hash?: string
  full_url?: string
}

export interface ConnectionAuthTaskFacade {
  getTask(taskId: string): Promise<ConnectionAuthTaskDetail>
  submitTask(taskId: string, request: ConnectionAuthTaskSubmitRequest): Promise<ConnectionAuthTaskDetail>
  completeCallback(taskId: string, request: ConnectionAuthTaskCallbackRequest): Promise<ConnectionAuthTaskDetail>
}

export type ConnectionAuthTaskTranslate = (
  key: string,
  fallback: string,
  params?: Record<string, unknown>,
) => string

export interface ConnectionAuthTaskRuntime {
  facade: ConnectionAuthTaskFacade
  routePrefix: string
  t: ConnectionAuthTaskTranslate
}

export const connectionAuthTaskRuntimeKey: InjectionKey<ConnectionAuthTaskRuntime> = Symbol(
  'connection-auth-task-runtime',
)

export function defaultTranslate(_key: string, fallback: string, params?: Record<string, unknown>): string {
  if (!params) return fallback
  return Object.entries(params).reduce((text, [name, value]) => {
    return text.split(`{${name}}`).join(String(value))
  }, fallback)
}

export function useConnectionAuthTaskRuntime(): ConnectionAuthTaskRuntime {
  const runtime = inject(connectionAuthTaskRuntimeKey)
  if (!runtime) throw new Error('Connection auth task runtime is missing')
  return runtime
}
