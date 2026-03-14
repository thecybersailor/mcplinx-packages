import { inject, type InjectionKey } from 'vue'

export interface TeamConnectorWorkbenchCard {
  id?: string
  name?: string
  package_description?: string
  icon_url?: string
  version?: string
}

export interface TeamConnectorWorkbenchResponse {
  available_connectors?: TeamConnectorWorkbenchCard[]
  discoverable_connectors?: TeamConnectorWorkbenchCard[]
  more_count?: number
}

export interface TeamConnectorWorkbenchDetail {
  connector_id?: string
  name?: string
  package_description?: string
  status?: string
  summary?: string
  next_steps?: string[]
  can_connect_directly?: boolean
}

export interface TeamConnectorWorkbenchCreateConnectionRequest {
  connector_id?: string
  label?: string
}

export interface TeamConnectorWorkbenchFacade {
  getWorkbench(query?: { limit?: number }): Promise<TeamConnectorWorkbenchResponse>
  getConnectorDetail(id: string): Promise<TeamConnectorWorkbenchDetail>
  createConnection(request: TeamConnectorWorkbenchCreateConnectionRequest): Promise<Record<string, unknown>>
}

export type TeamConnectorWorkbenchTranslate = (
  key: string,
  fallback: string,
  params?: Record<string, unknown>,
) => string

export interface TeamConnectorWorkbenchRuntime {
  facade: TeamConnectorWorkbenchFacade
  routePrefix: string
  t: TeamConnectorWorkbenchTranslate
}

export const teamConnectorWorkbenchRuntimeKey: InjectionKey<TeamConnectorWorkbenchRuntime> = Symbol(
  'team-connector-workbench-runtime',
)

export function defaultTranslate(_key: string, fallback: string, params?: Record<string, unknown>): string {
  if (!params) return fallback
  return Object.entries(params).reduce((text, [name, value]) => {
    return text.split(`{${name}}`).join(String(value))
  }, fallback)
}

export function useTeamConnectorWorkbenchRuntime(): TeamConnectorWorkbenchRuntime {
  const runtime = inject(teamConnectorWorkbenchRuntimeKey)
  if (!runtime) {
    throw new Error('Team connector workbench runtime is missing')
  }
  return runtime
}
