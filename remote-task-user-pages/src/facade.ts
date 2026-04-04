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
  tools?: Array<Record<string, unknown>>
  url?: string
}
export type RemoteTaskUserConnectionListResponse = VoVoConnectionListResponse
export type RemoteTaskExecution = {
  id?: string
  action_name?: string
  action_key?: string
  status?: string
  created_at?: string
} & Record<string, unknown>
export type RemoteTaskExecutionList = {
  executions?: RemoteTaskExecution[]
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
  deleteConnection(id: string): Promise<Record<string, unknown>>
  reauthConnection(id: string): Promise<RemoteTaskStartAuthResult>
  listTasks(query?: { limit?: number; offset?: number }): Promise<RemoteTaskExecutionList>
  getTask(id: string): Promise<RemoteTaskExecution>
  cancelTask(id: string): Promise<Record<string, unknown>>
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
