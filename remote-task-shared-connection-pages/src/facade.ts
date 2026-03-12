import { inject, type InjectionKey } from 'vue'

export type SharedConnectionScope = 'platform' | 'tenant' | 'team'

export interface SharedConnectionPackageBrief {
  icon_url?: string
  name?: string
}

export interface SharedConnectionRecord {
  id?: string
  connector_id?: string
  package?: SharedConnectionPackageBrief
  label?: string
  status?: string
  requires_reauth?: boolean
  scope?: string
  principal_pattern?: string
  inherits_to?: string[]
  resolution_hint?: string
  created_at?: string
  updated_at?: string
}

export interface SharedConnectionListResponse {
  items?: SharedConnectionRecord[]
}

export interface SharedConnectionMutationRequest {
  connector_id?: string
  label?: string
  scope?: string
  principal_pattern?: string
  inherits_to?: string[]
}

export interface SharedConnectionStartAuthRequest extends SharedConnectionMutationRequest {
  redirect_uri?: string
  redirect_url?: string
}

export interface SharedConnectionStartAuthResponse {
  connection_id?: string
  connection_label?: string
  fields?: Array<Record<string, unknown>>
  type?: string
  url?: string
}

export interface SharedConnectionSubmitAuthRequest extends SharedConnectionMutationRequest {
  connection_id?: string
  auth_data?: Record<string, unknown>
}

export interface SharedConnectionFallbackCandidate {
  id?: string
  scope?: string
  principal_pattern?: string
  inherits_to?: string[]
  resolution_hint?: string
}

export interface SharedConnectionFallbackExplainResponse {
  connector_id?: string
  selected?: SharedConnectionRecord
  candidates?: SharedConnectionFallbackCandidate[]
}

export type RemoteTaskSharedConnectionTranslate = (
  key: string,
  fallback: string,
  params?: Record<string, unknown>,
) => string

export interface RemoteTaskSharedConnectionFacade {
  listConnections(query?: { scope?: string; principal_pattern?: string; connector_id?: string }): Promise<SharedConnectionListResponse>
  createConnection(request: SharedConnectionMutationRequest): Promise<SharedConnectionRecord>
  startAuth(request: SharedConnectionStartAuthRequest): Promise<SharedConnectionStartAuthResponse>
  submitAuth(request: SharedConnectionSubmitAuthRequest): Promise<SharedConnectionRecord>
  getConnection(id: string): Promise<SharedConnectionRecord>
  updateConnection(id: string, request: SharedConnectionMutationRequest): Promise<SharedConnectionRecord>
  deleteConnection(id: string): Promise<Record<string, unknown>>
  reauthConnection(id: string, request?: SharedConnectionStartAuthRequest): Promise<SharedConnectionStartAuthResponse>
  explainFallback(query: { connector_id: string }): Promise<SharedConnectionFallbackExplainResponse>
}

export interface RemoteTaskSharedConnectionRuntime {
  facade: RemoteTaskSharedConnectionFacade
  scope: SharedConnectionScope
  routePrefix: string
  t: RemoteTaskSharedConnectionTranslate
}

export const remoteTaskSharedConnectionRuntimeKey: InjectionKey<RemoteTaskSharedConnectionRuntime> = Symbol(
  'remote-task-shared-connection-runtime',
)

export function defaultTranslate(_key: string, fallback: string, params?: Record<string, unknown>): string {
  if (!params) return fallback
  return Object.entries(params).reduce((text, [name, value]) => text.split(`{${name}}`).join(String(value)), fallback)
}

export function useRemoteTaskSharedConnectionRuntime(): RemoteTaskSharedConnectionRuntime {
  const runtime = inject(remoteTaskSharedConnectionRuntimeKey)
  if (!runtime) throw new Error('Remote task shared connection runtime is missing')
  return runtime
}
