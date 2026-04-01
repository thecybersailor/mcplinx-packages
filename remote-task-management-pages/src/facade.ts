import { inject, type InjectionKey } from 'vue'
import type {
  AdminReviewInstanceRequest,
  VoAdminConnectorInstanceResponse,
  VoAdminConnectorPkgResponse,
  VoAdminConnectorPkgVersionResponse,
} from '@mcplinx/api-client-admin'
import type {
  DeveloperDeployRequest,
  DeveloperDeployResponse,
  DeveloperPublishRequest,
  DeveloperUploadURLRequest,
  DeveloperUploadURLResponse,
} from '@mcplinx/api-client-developer'

export type RemoteTaskManagementPackage = VoAdminConnectorPkgResponse & {
  package_description?: string
  source_id?: string
  totalInstances?: number
  activeInstances?: number
  publicInstances?: number
  pendingReviews?: number
}
export type RemoteTaskManagementPackageVersion = VoAdminConnectorPkgVersionResponse & {
  toolCount?: number
  createdAt?: string
}
export type RemoteTaskManagementInstance = VoAdminConnectorInstanceResponse & {
  instance_description?: string
  pkgName?: string
  pkg_id?: string
  ownerName?: string
  ownerId?: string | number
  ownerID?: string | number
  description?: string
  updatedAt?: string
  oauthCallbackURL?: string
  envConfig?: Record<string, unknown>
  secretConfig?: Record<string, boolean>
  versions?: RemoteTaskManagementPackageVersion[]
}
export type RemoteTaskManagementConfigRecord = {
  id?: string
  name?: string
  status?: string
  description?: string
  version?: string
  visibility?: string
  env_config?: Record<string, unknown>
  secret_config?: Record<string, boolean>
}
export type RemoteTaskManagementReviewRequest = AdminReviewInstanceRequest
export interface RemoteTaskManagementCreateInstanceRequest {
  pkg_id: string
  name: string
  active_version: string
  description?: string
  visibility?: string
  env_config?: Record<string, unknown>
  secret_config?: Record<string, unknown>
}
export type RemoteTaskManagementUploadURLRequest = DeveloperUploadURLRequest
export type RemoteTaskManagementUploadURLResponse = DeveloperUploadURLResponse
export type RemoteTaskManagementPublishRequest = DeveloperPublishRequest
export type RemoteTaskManagementDeployRequest = DeveloperDeployRequest
export type RemoteTaskManagementDeployResponse = DeveloperDeployResponse
export type RemoteTaskManagementScope = 'platform' | 'tenant' | 'team'

export type RemoteTaskManagementTranslate = (
  key: string,
  fallback: string,
  params?: Record<string, unknown>,
) => string

export interface RemoteTaskManagementFacade {
  listPackages(query?: { status?: string; visibility?: string; author_id?: string }): Promise<RemoteTaskManagementPackage[]>
  getPackage(pkgId: string): Promise<RemoteTaskManagementPackage>
  listPackageVersions(pkgId: string): Promise<RemoteTaskManagementPackageVersion[]>
  listPackageInstances(pkgId: string): Promise<RemoteTaskManagementInstance[]>
  listInstances(query?: { status?: string }): Promise<RemoteTaskManagementInstance[]>
  createInstance?: (request: RemoteTaskManagementCreateInstanceRequest) => Promise<RemoteTaskManagementInstance>
  getInstance(instanceId: string): Promise<RemoteTaskManagementInstance>
  updateInstance?: (instanceId: string, request: RemoteTaskManagementCreateInstanceRequest) => Promise<RemoteTaskManagementInstance>
  reviewInstance?: (instanceId: string, request: RemoteTaskManagementReviewRequest) => Promise<Record<string, unknown>>
  createUploadUrls(request: RemoteTaskManagementUploadURLRequest): Promise<RemoteTaskManagementUploadURLResponse>
  publish(request: RemoteTaskManagementPublishRequest): Promise<Record<string, unknown>>
  deploy(request: RemoteTaskManagementDeployRequest): Promise<RemoteTaskManagementDeployResponse>
  rollback(request: RemoteTaskManagementDeployRequest): Promise<RemoteTaskManagementDeployResponse>
  listConfigs(): Promise<RemoteTaskManagementConfigRecord[]>
  getConfig(connectorId: string): Promise<RemoteTaskManagementConfigRecord>
  updateConfig(connectorId: string, request: Record<string, unknown>): Promise<RemoteTaskManagementConfigRecord>
}

export interface RemoteTaskManagementRuntime {
  facade: RemoteTaskManagementFacade
  scope: RemoteTaskManagementScope
  routePrefix: string
  sharedConnectionRoutePrefix?: string
  t: RemoteTaskManagementTranslate
}

export const remoteTaskManagementRuntimeKey: InjectionKey<RemoteTaskManagementRuntime> = Symbol('remote-task-management-runtime')

/** Replace `{name}` placeholders (used by remote-task copy + host fallbacks). Safe to run after vue-i18n.t when locale strings still contain braces. */
export function interpolateRemoteTaskPlaceholders(text: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return text
  return Object.entries(params).reduce((acc, [name, value]) => acc.split(`{${name}}`).join(String(value)), text)
}

export function defaultTranslate(_key: string, fallback: string, params?: Record<string, unknown>): string {
  return interpolateRemoteTaskPlaceholders(fallback, params)
}

export function useRemoteTaskManagementRuntime(): RemoteTaskManagementRuntime {
  const runtime = inject(remoteTaskManagementRuntimeKey)
  if (!runtime) throw new Error('Remote task management runtime is missing')
  return runtime
}

export function remoteTaskManagementPageTestId(runtime: RemoteTaskManagementRuntime, page: string): string {
  if (runtime.scope === 'team') {
    return `remote-task-management.${page}.page`
  }
  return `remote-task-admin.${page}.page`
}
