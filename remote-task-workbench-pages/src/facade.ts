import { inject, type InjectionKey } from 'vue'

export interface ConnectorWorkbenchCard {
  id?: string
  name?: string
  package_description?: string
  icon_url?: string
  version?: string
}

export interface ConnectorWorkbenchResponse {
  available_connectors?: ConnectorWorkbenchCard[]
  discoverable_connectors?: ConnectorWorkbenchCard[]
  more_count?: number
}

export interface ConnectorWorkbenchDetail {
  connector_id?: string
  name?: string
  package_description?: string
  status?: string
  summary?: string
  next_steps?: string[]
  can_connect_directly?: boolean
}

export interface ConnectorWorkbenchCreateConnectionRequest {
  connector_id?: string
  label?: string
}

export interface ConnectorWorkbenchFacade {
  getWorkbench(query?: { limit?: number }): Promise<ConnectorWorkbenchResponse>
  getConnectorDetail(id: string): Promise<ConnectorWorkbenchDetail>
  createConnection(request: ConnectorWorkbenchCreateConnectionRequest): Promise<Record<string, unknown>>
}

export type ConnectorWorkbenchTranslate = (
  key: string,
  fallback: string,
  params?: Record<string, unknown>,
) => string

export interface ConnectorWorkbenchRuntime {
  facade: ConnectorWorkbenchFacade
  routePrefix: string
  t: ConnectorWorkbenchTranslate
}

export const connectorWorkbenchRuntimeKey: InjectionKey<ConnectorWorkbenchRuntime> = Symbol(
  'connector-workbench-runtime',
)

export function defaultTranslate(_key: string, fallback: string, params?: Record<string, unknown>): string {
  if (!params) return fallback
  return Object.entries(params).reduce((text, [name, value]) => {
    return text.split(`{${name}}`).join(String(value))
  }, fallback)
}

export function useConnectorWorkbenchRuntime(): ConnectorWorkbenchRuntime {
  const runtime = inject(connectorWorkbenchRuntimeKey)
  if (!runtime) {
    throw new Error('Connector workbench runtime is missing')
  }
  return runtime
}
