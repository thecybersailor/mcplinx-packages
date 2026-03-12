/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface AuthCompleteSessionRequest {
  jwt: string;
  refresh_token?: string;
  user_email?: string;
}

export interface AuthCompleteSessionResponse {
  success?: boolean;
}

export interface AuthCreateSessionRequest {
  client_name?: string;
  client_version?: string;
}

export interface AuthCreateSessionResponse {
  expires_at?: string;
  poll_interval?: number;
  session_id?: string;
}

export interface AuthGetSessionResponse {
  jwt?: string;
  refresh_token?: string;
  status?: string;
  user_email?: string;
}

export interface AuthRefreshTokenRequest {
  refresh_token: string;
}

export interface AuthRefreshTokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
}

export interface DeveloperDeployRequest {
  instance_id?: string;
  name?: string;
  version?: string;
}

export interface DeveloperDeployResponse {
  available_instances?: Record<string, any>[];
  instance_id?: string;
  instance_name?: string;
  message?: string;
  needs_selection?: boolean;
  version?: string;
}

export interface DeveloperPublishRequest {
  name?: string;
}

export interface DeveloperPublishResponse {
  version?: string;
}

export interface DeveloperSetActiveVersionRequest {
  version?: string;
}

export interface DeveloperUploadURLRequest {
  files?: string[];
  name?: string;
}

export interface DeveloperUploadURLResponse {
  upload_urls?: Record<string, string>;
}

export interface InternalRemoteTaskActivateRequest {
  callback_code?: string;
}

export interface InternalRemoteTaskConnectionsActivateRequest {
  auth_scopes?: string[];
  callback_code?: string;
  connector_id?: string;
  label?: string;
  required_scopes?: string[];
}

export interface InternalRemoteTaskUpdateExecutionRequest {
  error?: any;
  result?: Record<string, any>;
  status: string;
}

export interface ModelsConnectorPkg {
  appId?: string;
  createdAt?: string;
  hashId?: string;
  iconUpdatedAt?: string;
  icon_url?: string;
  id?: number;
  name?: string;
  package_description?: string;
  pkgKey?: string;
  updatedAt?: string;
}

export interface ModelsConnectorPkgVersion {
  active?: boolean;
  appId?: string;
  createdAt?: string;
  id?: number;
  pkgKey?: string;
  updatedAt?: string;
  version?: string;
}

export interface ModelsRegistryConnectorPkg {
  activeVersion?: string;
  appId?: string;
  createdAt?: string;
  description?: string;
  /** Stable external identifier: same as package.json "name". */
  id?: string;
  /** display name */
  name?: string;
  ownerSub?: string;
  status?: string;
  updatedAt?: string;
  visibility?: string;
}

export interface ModelsRegistryConnectorVersion {
  appId?: string;
  bundlePath?: string;
  createdAt?: string;
  id?: number;
  manifest?: number[];
  ownerSub?: string;
  pkgId?: string;
  toolCount?: number;
  updatedAt?: string;
  version?: string;
}

export interface PinResponse {
  data?: any;
  error?: PinResponseError;
  meta?: Record<string, any>;
  trace_id?: string;
}

export interface PinResponseError {
  key?: string;
  message?: string;
  type?: string;
}

export interface V1ExecuteReq {
  input?: Record<string, any>;
}

export interface V1RemoteTaskCreateConnectionRequest {
  connector_id?: string;
  label?: string;
}

export interface V1RemoteTaskSearchConnectorsRequest {
  exclude_connected?: boolean;
  limit?: number;
  offset?: number;
  query?: string;
}

export interface V1RemoteTaskSearchToolsRequest {
  limit?: number;
  offset?: number;
  query?: string;
}

export interface V1UpsertConnectorActionsRequest {
  actions?: {
    actionKey?: string;
    inputSchema?: Record<string, any>;
    summary?: string;
    title?: string;
  }[];
}

export interface V1UpsertConnectorPkgRequest {
  icon_url?: string;
  name?: string;
  package_description?: string;
  pkgKey?: string;
}

export interface V1UpsertConnectorVersionRequest {
  active?: boolean;
  manifest?: any;
  version?: string;
}

export interface VoConnectionDTO {
  connectorKey?: string;
  createdAt?: number;
  id?: string;
  name?: string;
  tags?: string[];
  updatedAt?: number;
}

export interface VoCreateConnectionRequest {
  config?: Record<string, any>;
  connectorKey?: string;
  edgeConnectionId?: string;
  name?: string;
  tags?: string[];
}

export interface VoMcpCompatActionDetails {
  action_description?: string;
  inputFields?: VoMcpCompatInputField[];
  key?: string;
  kind?: string;
  name?: string;
}

export interface VoMcpCompatActionInfo {
  key?: string;
  name?: string;
}

export interface VoMcpCompatActionMatch {
  action?: VoMcpCompatActionInfo;
  connection?: VoMcpCompatConnectionInfo;
}

export interface VoMcpCompatCancelRequest {
  execution_id?: string;
}

export interface VoMcpCompatCancelResponse {
  execution_id?: string;
  status?: string;
}

export interface VoMcpCompatCheckStatusRequest {
  execution_id?: string;
}

export interface VoMcpCompatCheckStatusResponse {
  error?: Record<string, any>;
  execution_id?: string;
  output?: Record<string, any>;
  status?: string;
}

export interface VoMcpCompatConnectionInfo {
  connector?: VoMcpCompatConnectorInfo;
  displayName?: string;
  id?: string;
  label?: string;
}

export interface VoMcpCompatConnectorInfo {
  key?: string;
  name?: string;
}

export interface VoMcpCompatDocMatch {
  content?: string;
  heading?: string;
  source?: string;
}

export interface VoMcpCompatExecuteAsyncActionRequest {
  action_key?: string;
  connection_id?: string;
  input?: Record<string, any>;
}

export interface VoMcpCompatExecuteAsyncActionResponse {
  execution_id?: string;
  status?: string;
  status_url?: string;
  task_id?: string;
  webhook_supported?: boolean;
}

export interface VoMcpCompatFindActionsRequest {
  query?: string;
}

export interface VoMcpCompatFindActionsResponse {
  actions?: VoMcpCompatActionMatch[];
}

export interface VoMcpCompatGetActionDetailsRequest {
  actionKey?: string;
  connectionId?: string;
}

export interface VoMcpCompatGetActionDetailsResponse {
  action?: VoMcpCompatActionDetails;
  connection?: VoMcpCompatConnectionInfo;
}

export interface VoMcpCompatInputField {
  helpText?: string;
  key?: string;
  label?: string;
  required?: boolean;
  type?: string;
}

export interface VoMcpCompatLearnServiceRequest {
  connectionId?: string;
  query?: string;
}

export interface VoMcpCompatLearnServiceResponse {
  connection?: VoMcpCompatConnectionInfo;
  docs?: VoMcpCompatDocMatch[];
}

export interface VoRemoteTaskStartAuthRequest {
  redirect_uri?: string;
  redirect_url?: string;
}

export interface VoRemoteTaskStartAuthResponse {
  connection_label?: string;
  fields?: Record<string, any>[];
  type?: string;
  url?: string;
}

export interface VoRemoteTaskSubmitAuthRequest {
  auth_data?: Record<string, any>;
  connector_id?: string;
  label?: string;
}

export interface VoRemoteTaskSubmitAuthResponse {
  connection_id?: string;
  label?: string;
  status?: string;
}

export interface VoVoConnection {
  auth_scopes?: string[];
  connector_id?: string;
  created_at?: string;
  id?: string;
  label?: string;
  last_used_at?: string;
  package?: VoVoConnectorPackageBrief;
  required_scopes?: string[];
  requires_reauth?: boolean;
  status?: string;
  token_expires_at?: string;
  updated_at?: string;
}

export interface VoVoConnectionListResponse {
  connections?: VoVoConnection[];
}

export interface VoVoConnectorPackageBrief {
  icon_url?: string;
  id?: string;
  name?: string;
  package_description?: string;
}

export interface VoVoConnectorResponse {
  created_at?: string;
  download_url?: string;
  error_message?: string;
  id?: string;
  package?: VoVoConnectorPackageBrief;
  relevance?: number;
  tool_count?: number;
  updated_at?: string;
  version?: string;
}

export interface VoVoConnectorToolsResponse {
  connector_id?: string;
  package?: VoVoConnectorPackageBrief;
  tools?: VoVoTool[];
}

export interface VoVoPagination {
  limit?: number;
  offset?: number;
  total?: number;
}

export interface VoVoTool {
  connector_id?: string;
  id?: string;
  kind?: string;
  name?: string;
  package?: VoVoConnectorPackageBrief;
  param_schema?: any;
  relevance?: number;
  tool_description?: string;
  tool_key?: string;
}

export interface VoVoUserConnectorListResponse {
  connectors?: VoVoConnectorResponse[];
  pagination?: VoVoPagination;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "/";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter((key) => "undefined" !== typeof query[key]);
    return keys
      .map((key) => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string") ? JSON.stringify(input) : input,
    [ContentType.Text]: (input: any) => (input !== null && typeof input !== "string" ? JSON.stringify(input) : input),
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(`${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`, {
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
      },
      signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) || null,
      body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
    }).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Remote Skill Hub API
 * @version 0.1.0
 * @baseUrl /
 * @contact
 *
 * Remote Skill Hub API
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  wellKnown = {
    /**
     * No description
     *
     * @tags public
     * @name AppAuthJsonDetail
     * @summary Edge auth well-known config (app-scoped)
     * @request GET:/.well-known/app/{app_id}/auth.json
     */
    appAuthJsonDetail: (appId: string, params: RequestParams = {}) =>
      this.request<PinResponse, PinResponse>({
        path: `/.well-known/app/${appId}/auth.json`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  test = {
    /**
     * @description Return an INVALID_PARAM error for local testing and API contract checks.
     *
     * @tags Public
     * @name ErrorList
     * @summary Trigger test error response
     * @request GET:/__test/error
     */
    errorList: (params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/__test/error`,
        method: "GET",
        ...params,
      }),
  };
  admin = {
    /**
     * No description
     *
     * @tags Admin
     * @name RemoteTaskConnectorPkgsList
     * @summary List connector packages
     * @request GET:/admin/remote-task/connector-pkgs
     * @secure
     */
    remoteTaskConnectorPkgsList: (params: RequestParams = {}) =>
      this.request<PinResponse, any>({
        path: `/admin/remote-task/connector-pkgs`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin
     * @name SubscriptionPlansList
     * @summary List subscription plans
     * @request GET:/admin/subscription-plans
     * @secure
     */
    subscriptionPlansList: (params: RequestParams = {}) =>
      this.request<PinResponse, any>({
        path: `/admin/subscription-plans`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin
     * @name UsersList
     * @summary List users
     * @request GET:/admin/users
     * @secure
     */
    usersList: (params: RequestParams = {}) =>
      this.request<PinResponse, any>({
        path: `/admin/users`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  auth = {
    /**
     * @description Refresh an access token by refresh token.
     *
     * @tags Auth
     * @name RefreshCreate
     * @summary Refresh token
     * @request POST:/auth/refresh
     */
    refreshCreate: (request: AuthRefreshTokenRequest, params: RequestParams = {}) =>
      this.request<AuthRefreshTokenResponse, PinResponse>({
        path: `/auth/refresh`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new authentication session for CLI-style login flow.
     *
     * @tags Auth
     * @name SessionsCreate
     * @summary Create auth session
     * @request POST:/auth/sessions
     */
    sessionsCreate: (request: AuthCreateSessionRequest, params: RequestParams = {}) =>
      this.request<AuthCreateSessionResponse, PinResponse>({
        path: `/auth/sessions`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get auth session status by ID.
     *
     * @tags Auth
     * @name SessionsDetail
     * @summary Get auth session
     * @request GET:/auth/sessions/{id}
     */
    sessionsDetail: (id: string, params: RequestParams = {}) =>
      this.request<AuthGetSessionResponse, PinResponse>({
        path: `/auth/sessions/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Complete an auth session with JWT and optional user identifiers.
     *
     * @tags Auth
     * @name SessionsCompleteCreate
     * @summary Complete auth session
     * @request POST:/auth/sessions/{id}/complete
     */
    sessionsCompleteCreate: (id: string, request: AuthCompleteSessionRequest, params: RequestParams = {}) =>
      this.request<AuthCompleteSessionResponse, PinResponse>({
        path: `/auth/sessions/${id}/complete`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  debug = {
    /**
     * No description
     *
     * @tags public
     * @name WhoamiList
     * @summary Current owner identity
     * @request GET:/debug/whoami
     * @secure
     */
    whoamiList: (params: RequestParams = {}) =>
      this.request<PinResponse, PinResponse>({
        path: `/debug/whoami`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  developer = {
    /**
     * @description List all connectors for current developer account.
     *
     * @tags Developer
     * @name RegistryConnectorsList
     * @summary List developer registry connectors
     * @request GET:/developer/registry/connectors
     * @secure
     */
    registryConnectorsList: (params: RequestParams = {}) =>
      this.request<ModelsRegistryConnectorPkg[], PinResponse>({
        path: `/developer/registry/connectors`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one connector package details.
     *
     * @tags Developer
     * @name RegistryConnectorsDetail
     * @summary Get registry connector
     * @request GET:/developer/registry/connectors/{id}
     * @secure
     */
    registryConnectorsDetail: (id: string, params: RequestParams = {}) =>
      this.request<ModelsRegistryConnectorPkg, PinResponse>({
        path: `/developer/registry/connectors/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete one connector package and related versions.
     *
     * @tags Developer
     * @name RegistryConnectorsDelete
     * @summary Delete registry connector
     * @request DELETE:/developer/registry/connectors/{id}
     * @secure
     */
    registryConnectorsDelete: (id: string, params: RequestParams = {}) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/developer/registry/connectors/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Set the active version for the connector package.
     *
     * @tags Developer
     * @name RegistryConnectorsActiveUpdate
     * @summary Set active registry version
     * @request PUT:/developer/registry/connectors/{id}/active
     * @secure
     */
    registryConnectorsActiveUpdate: (id: string, body: DeveloperSetActiveVersionRequest, params: RequestParams = {}) =>
      this.request<ModelsRegistryConnectorPkg, PinResponse>({
        path: `/developer/registry/connectors/${id}/active`,
        method: "PUT",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List all published versions of a connector package.
     *
     * @tags Developer
     * @name RegistryConnectorsVersionsDetail
     * @summary List registry connector versions
     * @request GET:/developer/registry/connectors/{id}/versions
     * @secure
     */
    registryConnectorsVersionsDetail: (id: string, params: RequestParams = {}) =>
      this.request<ModelsRegistryConnectorVersion[], PinResponse>({
        path: `/developer/registry/connectors/${id}/versions`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one connector version by version key.
     *
     * @tags Developer
     * @name RegistryConnectorsVersionsDetail2
     * @summary Get registry connector version
     * @request GET:/developer/registry/connectors/{id}/versions/{ver}
     * @originalName registryConnectorsVersionsDetail
     * @duplicate
     * @secure
     */
    registryConnectorsVersionsDetail2: (id: string, ver: string, params: RequestParams = {}) =>
      this.request<ModelsRegistryConnectorVersion, PinResponse>({
        path: `/developer/registry/connectors/${id}/versions/${ver}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a single connector package version.
     *
     * @tags Developer
     * @name RegistryConnectorsVersionsDelete
     * @summary Delete registry connector version
     * @request DELETE:/developer/registry/connectors/{id}/versions/{ver}
     * @secure
     */
    registryConnectorsVersionsDelete: (id: string, ver: string, params: RequestParams = {}) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/developer/registry/connectors/${id}/versions/${ver}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Set active version on an existing registry connector package.
     *
     * @tags Developer
     * @name RegistryDeployCreate
     * @summary Deploy registry connector
     * @request POST:/developer/registry/deploy
     * @secure
     */
    registryDeployCreate: (body: DeveloperDeployRequest, params: RequestParams = {}) =>
      this.request<DeveloperDeployResponse, PinResponse>({
        path: `/developer/registry/deploy`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Activate latest uploaded bundle/manifest pair as a new connector version.
     *
     * @tags Developer
     * @name RegistryPublishCreate
     * @summary Publish registry connector
     * @request POST:/developer/registry/publish
     * @secure
     */
    registryPublishCreate: (body: DeveloperPublishRequest, params: RequestParams = {}) =>
      this.request<DeveloperPublishResponse, PinResponse>({
        path: `/developer/registry/publish`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Create upload URL bundle for manifest.json and bundle.js.
     *
     * @tags Developer
     * @name RegistryUploadUrlCreate
     * @summary Get developer registry upload URLs
     * @request POST:/developer/registry/upload-url
     * @secure
     */
    registryUploadUrlCreate: (body: DeveloperUploadURLRequest, params: RequestParams = {}) =>
      this.request<DeveloperUploadURLResponse, PinResponse>({
        path: `/developer/registry/upload-url`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Upload bundle.js or manifest.json file using tokenized upload session.
     *
     * @tags Developer
     * @name RegistryUploadsUpdate
     * @summary Upload registry artifact file
     * @request PUT:/developer/registry/uploads/{upload_id}/{filename}
     */
    registryUploadsUpdate: (
      uploadId: string,
      filename: string,
      query: {
        /** Upload token */
        token: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/developer/registry/uploads/${uploadId}/${filename}`,
        method: "PUT",
        query: query,
        format: "json",
        ...params,
      }),
  };
  healthz = {
    /**
     * No description
     *
     * @tags public
     * @name HealthzList
     * @summary Health check
     * @request GET:/healthz
     */
    healthzList: (params: RequestParams = {}) =>
      this.request<PinResponse, any>({
        path: `/healthz`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  internal = {
    /**
     * @description Mark a pending remote-task connection as active after callback verification.
     *
     * @tags Internal
     * @name RemoteTaskActivateCreate
     * @summary Activate remote task connection
     * @request POST:/internal/remote-task/activate
     */
    remoteTaskActivateCreate: (body: InternalRemoteTaskActivateRequest, params: RequestParams = {}) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/internal/remote-task/activate`,
        method: "POST",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Activate pending connection and persist optional connector metadata.
     *
     * @tags Internal
     * @name RemoteTaskConnectionsActivateCreate
     * @summary Activate remote task connection with metadata
     * @request POST:/internal/remote-task/connections/activate
     */
    remoteTaskConnectionsActivateCreate: (
      body: InternalRemoteTaskConnectionsActivateRequest,
      params: RequestParams = {},
    ) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/internal/remote-task/connections/activate`,
        method: "POST",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update execution status and payload from internal worker callback.
     *
     * @tags Internal
     * @name RemoteTaskExecutionsUpdateCreate
     * @summary Update remote task execution
     * @request POST:/internal/remote-task/executions/{execution_id}/update
     */
    remoteTaskExecutionsUpdateCreate: (
      executionId: string,
      body: InternalRemoteTaskUpdateExecutionRequest,
      params: RequestParams = {},
    ) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/internal/remote-task/executions/${executionId}/update`,
        method: "POST",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  user = {
    /**
     * @description List connections in user app context.
     *
     * @tags User
     * @name AppConnectionsList
     * @summary List user-app connections
     * @request GET:/user/app/connections
     * @secure
     */
    appConnectionsList: (params: RequestParams = {}) =>
      this.request<VoVoConnectionListResponse, PinResponse>({
        path: `/user/app/connections`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create connection for connector directly in user app mode.
     *
     * @tags User
     * @name AppConnectionsCreate
     * @summary Create user-app connection
     * @request POST:/user/app/connections
     * @secure
     */
    appConnectionsCreate: (body: V1RemoteTaskCreateConnectionRequest, params: RequestParams = {}) =>
      this.request<VoVoConnection, PinResponse>({
        path: `/user/app/connections`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Submit auth data and create an active connection.
     *
     * @tags User
     * @name AppConnectionsSubmitAuthCreate
     * @summary Submit auth for user-app connection
     * @request POST:/user/app/connections/submit-auth
     * @secure
     */
    appConnectionsSubmitAuthCreate: (body: VoRemoteTaskSubmitAuthRequest, params: RequestParams = {}) =>
      this.request<VoRemoteTaskSubmitAuthResponse, PinResponse>({
        path: `/user/app/connections/submit-auth`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a connection by public connection ID.
     *
     * @tags User
     * @name AppConnectionsDelete
     * @summary Delete user-app connection
     * @request DELETE:/user/app/connections/{connection_id}
     * @secure
     */
    appConnectionsDelete: (connectionId: string, params: RequestParams = {}) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/user/app/connections/${connectionId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Start reauth flow for an existing connection.
     *
     * @tags User
     * @name AppConnectionsReauthCreate
     * @summary Reauth user-app connection
     * @request POST:/user/app/connections/{connection_id}/reauth
     * @secure
     */
    appConnectionsReauthCreate: (connectionId: string, params: RequestParams = {}) =>
      this.request<any, PinResponse>({
        path: `/user/app/connections/${connectionId}/reauth`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * @description List connectors for user app with optional filters.
     *
     * @tags User
     * @name AppConnectorsList
     * @summary List user-app connectors
     * @request GET:/user/app/connectors
     * @secure
     */
    appConnectorsList: (
      query?: {
        /** Limit */
        limit?: number;
        /** Offset */
        offset?: number;
        /** Exclude already connected connectors */
        exclude_connected?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoVoUserConnectorListResponse, PinResponse>({
        path: `/user/app/connectors`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Search connectors by query text and vector ranking.
     *
     * @tags User
     * @name AppConnectorsSearchCreate
     * @summary Search user-app connectors
     * @request POST:/user/app/connectors/search
     * @secure
     */
    appConnectorsSearchCreate: (body: V1RemoteTaskSearchConnectorsRequest, params: RequestParams = {}) =>
      this.request<VoVoUserConnectorListResponse, PinResponse>({
        path: `/user/app/connectors/search`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Start OAuth or API-key based connector auth flow.
     *
     * @tags User
     * @name AppConnectorsStartAuthCreate
     * @summary Start connector auth
     * @request POST:/user/app/connectors/{connector_id}/start-auth
     * @secure
     */
    appConnectorsStartAuthCreate: (
      connectorId: string,
      body: VoRemoteTaskStartAuthRequest,
      params: RequestParams = {},
    ) =>
      this.request<VoRemoteTaskStartAuthResponse, PinResponse>({
        path: `/user/app/connectors/${connectorId}/start-auth`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List tools supported by a connector key.
     *
     * @tags User
     * @name AppConnectorsToolsDetail
     * @summary List connector tools
     * @request GET:/user/app/connectors/{id}/tools
     * @secure
     */
    appConnectorsToolsDetail: (id: string, params: RequestParams = {}) =>
      this.request<VoVoConnectorToolsResponse, PinResponse>({
        path: `/user/app/connectors/${id}/tools`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Cancel pending async execution if applicable.
     *
     * @tags User
     * @name AppMcpCancelCreate
     * @summary MCP compatibility: cancel execution
     * @request POST:/user/app/mcp/cancel
     * @secure
     */
    appMcpCancelCreate: (body: VoMcpCompatCancelRequest, params: RequestParams = {}) =>
      this.request<VoMcpCompatCancelResponse, PinResponse>({
        path: `/user/app/mcp/cancel`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Query execution status from MCP compatibility layer.
     *
     * @tags User
     * @name AppMcpCheckStatusCreate
     * @summary MCP compatibility: check status
     * @request POST:/user/app/mcp/check-status
     * @secure
     */
    appMcpCheckStatusCreate: (body: VoMcpCompatCheckStatusRequest, params: RequestParams = {}) =>
      this.request<VoMcpCompatCheckStatusResponse, PinResponse>({
        path: `/user/app/mcp/check-status`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Execute action from compatibility endpoint and create execution task.
     *
     * @tags User
     * @name AppMcpExecuteAsyncActionCreate
     * @summary MCP compatibility: execute action
     * @request POST:/user/app/mcp/execute-async-action
     * @secure
     */
    appMcpExecuteAsyncActionCreate: (body: VoMcpCompatExecuteAsyncActionRequest, params: RequestParams = {}) =>
      this.request<VoMcpCompatExecuteAsyncActionResponse, PinResponse>({
        path: `/user/app/mcp/execute-async-action`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Find MCP actions through compatibility endpoint.
     *
     * @tags User
     * @name AppMcpFindActionsCreate
     * @summary MCP compatibility: find actions
     * @request POST:/user/app/mcp/find-actions
     * @secure
     */
    appMcpFindActionsCreate: (body: VoMcpCompatFindActionsRequest, params: RequestParams = {}) =>
      this.request<VoMcpCompatFindActionsResponse, PinResponse>({
        path: `/user/app/mcp/find-actions`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get detailed action metadata for compatibility layer.
     *
     * @tags User
     * @name AppMcpGetActionDetailsCreate
     * @summary MCP compatibility: get action details
     * @request POST:/user/app/mcp/get-action-details
     * @secure
     */
    appMcpGetActionDetailsCreate: (body: VoMcpCompatGetActionDetailsRequest, params: RequestParams = {}) =>
      this.request<VoMcpCompatGetActionDetailsResponse, PinResponse>({
        path: `/user/app/mcp/get-action-details`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Return MCP service discovery docs for compatibility.
     *
     * @tags User
     * @name AppMcpLearnServiceCreate
     * @summary MCP compatibility: learn service
     * @request POST:/user/app/mcp/learn-service
     * @secure
     */
    appMcpLearnServiceCreate: (body: VoMcpCompatLearnServiceRequest, params: RequestParams = {}) =>
      this.request<VoMcpCompatLearnServiceResponse, PinResponse>({
        path: `/user/app/mcp/learn-service`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List tools for all or one connector.
     *
     * @tags User
     * @name AppToolsList
     * @summary List tools
     * @request GET:/user/app/tools
     * @secure
     */
    appToolsList: (
      query?: {
        /** Optional connector filter */
        connector_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoVoTool[], PinResponse>({
        path: `/user/app/tools`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Search tools by query text and ranking.
     *
     * @tags User
     * @name AppToolsSearchCreate
     * @summary Search tools
     * @request POST:/user/app/tools/search
     * @secure
     */
    appToolsSearchCreate: (body: V1RemoteTaskSearchToolsRequest, params: RequestParams = {}) =>
      this.request<VoVoTool[], PinResponse>({
        path: `/user/app/tools/search`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get tool schema by tool id.
     *
     * @tags User
     * @name AppToolsDetail
     * @summary Get tool
     * @request GET:/user/app/tools/{tool_id}
     * @secure
     */
    appToolsDetail: (toolId: string, params: RequestParams = {}) =>
      this.request<VoVoTool, PinResponse>({
        path: `/user/app/tools/${toolId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  v1 = {
    /**
     * @description List all created connections.
     *
     * @tags User
     * @name ConnectionsList
     * @summary List connections
     * @request GET:/v1/connections
     * @secure
     */
    connectionsList: (params: RequestParams = {}) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/v1/connections`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new connection for current application.
     *
     * @tags User
     * @name ConnectionsCreate
     * @summary Create connection
     * @request POST:/v1/connections
     * @secure
     */
    connectionsCreate: (body: VoCreateConnectionRequest, params: RequestParams = {}) =>
      this.request<VoConnectionDTO, PinResponse>({
        path: `/v1/connections`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get connection details by public connection ID.
     *
     * @tags User
     * @name ConnectionsDetail
     * @summary Get connection
     * @request GET:/v1/connections/{id}
     * @secure
     */
    connectionsDetail: (id: string, params: RequestParams = {}) =>
      this.request<VoConnectionDTO, PinResponse>({
        path: `/v1/connections/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get input schema of one action for a connector instance.
     *
     * @tags User
     * @name ConnectionsActionsDetail
     * @summary Get action details
     * @request GET:/v1/connections/{id}/actions/{actionKey}
     * @secure
     */
    connectionsActionsDetail: (id: string, actionKey: string, params: RequestParams = {}) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/v1/connections/${id}/actions/${actionKey}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Execute an action asynchronously/synchronously and return execution result.
     *
     * @tags User
     * @name ConnectionsActionsExecuteCreate
     * @summary Execute action
     * @request POST:/v1/connections/{id}/actions/{actionKey}/execute
     * @secure
     */
    connectionsActionsExecuteCreate: (id: string, actionKey: string, body: V1ExecuteReq, params: RequestParams = {}) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/v1/connections/${id}/actions/${actionKey}/execute`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List all connector packages for current app.
     *
     * @tags User
     * @name ConnectorsPkgsList
     * @summary List connector packages
     * @request GET:/v1/connectors/pkgs
     * @secure
     */
    connectorsPkgsList: (params: RequestParams = {}) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/v1/connectors/pkgs`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create or update connector package metadata.
     *
     * @tags User
     * @name ConnectorsPkgsCreate
     * @summary Upsert connector package
     * @request POST:/v1/connectors/pkgs
     * @secure
     */
    connectorsPkgsCreate: (body: V1UpsertConnectorPkgRequest, params: RequestParams = {}) =>
      this.request<ModelsConnectorPkg, PinResponse>({
        path: `/v1/connectors/pkgs`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Create or update connector package version with manifest payload.
     *
     * @tags User
     * @name ConnectorsPkgsVersionsCreate
     * @summary Upsert connector version
     * @request POST:/v1/connectors/pkgs/{pkgKey}/versions
     * @secure
     */
    connectorsPkgsVersionsCreate: (pkgKey: string, body: V1UpsertConnectorVersionRequest, params: RequestParams = {}) =>
      this.request<ModelsConnectorPkgVersion, PinResponse>({
        path: `/v1/connectors/pkgs/${pkgKey}/versions`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List active actions for a connector package.
     *
     * @tags User
     * @name ConnectorsPkgsVersionsActiveActionsDetail
     * @summary List active actions
     * @request GET:/v1/connectors/pkgs/{pkgKey}/versions/active/actions
     * @secure
     */
    connectorsPkgsVersionsActiveActionsDetail: (pkgKey: string, params: RequestParams = {}) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/v1/connectors/pkgs/${pkgKey}/versions/active/actions`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Replace action list for one package version.
     *
     * @tags User
     * @name ConnectorsPkgsVersionsActionsCreate
     * @summary Upsert connector actions
     * @request POST:/v1/connectors/pkgs/{pkgKey}/versions/{version}/actions
     * @secure
     */
    connectorsPkgsVersionsActionsCreate: (
      pkgKey: string,
      version: string,
      body: V1UpsertConnectorActionsRequest,
      params: RequestParams = {},
    ) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/v1/connectors/pkgs/${pkgKey}/versions/${version}/actions`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List execution history for current app owner and user.
     *
     * @tags User
     * @name ExecutionsList
     * @summary List executions
     * @request GET:/v1/executions
     * @secure
     */
    executionsList: (
      query?: {
        /** Limit */
        limit?: number;
        /** Offset */
        offset?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/v1/executions`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one execution detail.
     *
     * @tags User
     * @name ExecutionsDetail
     * @summary Get execution
     * @request GET:/v1/executions/{id}
     * @secure
     */
    executionsDetail: (id: string, params: RequestParams = {}) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/v1/executions/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete execution record by execution public ID.
     *
     * @tags User
     * @name ExecutionsDelete
     * @summary Delete execution
     * @request DELETE:/v1/executions/{id}
     * @secure
     */
    executionsDelete: (id: string, params: RequestParams = {}) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/v1/executions/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Search actions under MCP tag, with optional text filter.
     *
     * @tags User
     * @name McpQueryDetail
     * @summary Query MCP candidates
     * @request GET:/v1/mcp/{tag}/query
     * @secure
     */
    mcpQueryDetail: (
      tag: string,
      query?: {
        /** Search keyword */
        q?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<Record<string, any>, PinResponse>({
        path: `/v1/mcp/${tag}/query`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags public
     * @name GetV1
     * @summary Current user identity
     * @request GET:/v1/me
     * @secure
     */
    getV1: (params: RequestParams = {}) =>
      this.request<PinResponse, PinResponse>({
        path: `/v1/me`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
