import type { RouteComponent, RouteRecordRaw } from 'vue-router'

export interface ConnectorIndexCardStat {
  label: string
  value: string | number
}

export interface ConnectorIndexCard {
  id: string
  title: string
  description?: string
  actionLabel?: string
  actionTestId?: string
  actionVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  to?: Record<string, unknown> | string
  stats?: ConnectorIndexCardStat[]
}

export interface ConnectorDomainRouteOptions {
  basePath: string
  routePrefix: string
  shellComponent?: RouteComponent
  indexComponent: RouteComponent
  indexProps?: Record<string, unknown>
  connectionsChildren?: RouteRecordRaw[]
  catalogChildren?: RouteRecordRaw[]
  packagesChildren?: RouteRecordRaw[]
  instancesChildren?: RouteRecordRaw[]
  publishComponent?: RouteComponent
  deployComponent?: RouteComponent
  rollbackComponent?: RouteComponent
  configComponent?: RouteComponent
  extraChildren?: RouteRecordRaw[]
}
