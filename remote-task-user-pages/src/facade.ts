import { inject, type InjectionKey } from 'vue'
import type { ConnectionAuthTaskFacade } from '../../remote-task-connection-auth-pages/src/facade'
import type {
  V1RemoteTaskCreateConnectionRequest,
  VoRemoteTaskStartAuthResponse,
  VoVoConnection,
  VoVoConnectionListResponse,
  VoVoConnectorResponse,
  VoVoUserConnectorListResponse,
} from '@mcplinx/api-client-user'

export type RemoteTaskUserConnector = VoVoConnectorResponse & {
  tools?: Array<Record<string, unknown>>
}
export type RemoteTaskUserConnectorListResponse = VoVoUserConnectorListResponse
export type RemoteTaskUserConnection = VoVoConnection & {
  available_actions?: Array<Record<string, unknown>>
  tools?: Array<Record<string, unknown>>
  url?: string
}
export interface RemoteTaskConnectionActionDetail {
  description?: string
  input_schema?: Record<string, unknown>
  key?: string
  kind?: string
  name?: string
}
export interface RemoteTaskExecuteActionResponse {
  success?: boolean
  result?: Record<string, unknown>
  executed_at?: string
  execution_id?: string
  status?: string
  kind?: string
  duration?: number
  message?: string
  task_id?: string
  webhook_supported?: boolean
}
export type RemoteTaskUserConnectionListResponse = VoVoConnectionListResponse
export type RemoteTaskExecution = {
  action_description?: string
  id?: string
  action_name?: string
  action_key?: string
  status?: string
  created_at?: string
  finished_at?: string
  started_at?: string
  connection_id?: string
  external_task_id?: string
  task_info_url?: string
  webhook_supported?: boolean
  kind?: string
  input?: Record<string, unknown>
  result?: Record<string, unknown>
  error?: Record<string, unknown>
  package?: Record<string, unknown>
} & Record<string, unknown>
export type RemoteTaskExecutionList = {
  executions?: RemoteTaskExecution[]
  total?: number
  limit?: number
  offset?: number
}
export type RemoteTaskCreateConnectionRequest = V1RemoteTaskCreateConnectionRequest
export type RemoteTaskStartAuthResult = VoRemoteTaskStartAuthResponse
export type RemoteTaskUserMessages = Record<string, string>
export type RemoteTaskUserLocaleMap = Record<string, RemoteTaskUserMessages>

export type RemoteTaskUserTranslate = (
  key: string,
  fallback: string,
  params?: Record<string, unknown>,
) => string

export interface RemoteTaskUserFacade {
  listConnectors(query?: { exclude_connected?: boolean; limit?: number; offset?: number }): Promise<RemoteTaskUserConnectorListResponse>
  getConnector(id: string): Promise<RemoteTaskUserConnector>
  listConnections(query?: { limit?: number; offset?: number }): Promise<RemoteTaskUserConnectionListResponse>
  createConnection(request: RemoteTaskCreateConnectionRequest): Promise<RemoteTaskUserConnection>
  getConnection(id: string): Promise<RemoteTaskUserConnection>
  getConnectionAction(connectionId: string, actionKey: string): Promise<RemoteTaskConnectionActionDetail>
  executeConnectionAction(connectionId: string, actionKey: string, body: Record<string, unknown>): Promise<RemoteTaskExecuteActionResponse>
  deleteConnection(id: string): Promise<Record<string, unknown>>
  reauthConnection(id: string): Promise<RemoteTaskStartAuthResult>
  listTasks(query?: { limit?: number; offset?: number }): Promise<RemoteTaskExecutionList>
  getTask(id: string): Promise<RemoteTaskExecution>
  cancelTask(id: string): Promise<Record<string, unknown>>
  deleteTask(id: string): Promise<Record<string, unknown>>
}

export interface RemoteTaskUserRuntime {
  facade: RemoteTaskUserFacade
  authTaskFacade: ConnectionAuthTaskFacade
  routePrefix: string
  t: RemoteTaskUserTranslate
}

export const remoteTaskUserRuntimeKey: InjectionKey<RemoteTaskUserRuntime> = Symbol('remote-task-user-runtime')

export function defaultTranslate(_key: string, fallback: string, params?: Record<string, unknown>): string {
  if (!params) return fallback
  return Object.entries(params).reduce((text, [name, value]) => {
    return text.split(`{${name}}`).join(String(value))
  }, fallback)
}

export function useRemoteTaskUserRuntime(): RemoteTaskUserRuntime {
  const runtime = inject(remoteTaskUserRuntimeKey)
  if (!runtime) {
    throw new Error('Remote task user runtime is missing')
  }
  return runtime
}
