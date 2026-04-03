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

export interface AdminAdminAIProviderModelInfo {
  description?: string;
  enabled?: boolean;
  model_id?: string;
  name?: string;
  status?: string;
}

export interface AdminAdminAIProviderModelListResponse {
  models?: AdminAdminAIProviderModelInfo[];
  provider_id?: string;
}

export interface AdminAdminAIProviderResponse {
  description?: string;
  id?: string;
  name?: string;
}

export interface AdminAdminUpdateModelBlacklistRequest {
  enabled?: boolean;
}

export interface AdminCreateInstanceRequest {
  active_version: string;
  description?: string;
  env_config?: Record<string, any>;
  name: string;
  pkg_id: string;
  secret_config?: Record<string, any>;
  visibility?: string;
}

export interface AdminPublishProviderCatalogRequest {
  ignore_cache?: boolean;
}

export interface AdminPublishProviderCatalogResponse {
  generated_at?: number;
  success?: boolean;
}

export interface AdminReviewInstanceRequest {
  /** approve or reject */
  action: string;
  env_config?: Record<string, any>;
  reason?: string;
}

export interface AdminUpdatePkgStatusRequest {
  reason?: string;
  status: string;
}

export type GinH = Record<string, any>;

export enum ModelsPaymentPlatform {
  PaymentPlatformStripe = "STRIPE",
  PaymentPlatformAppStore = "APP_STORE",
  PaymentPlatformGooglePlay = "GOOGLE_PLAY",
}

export interface ModelsPlatformPrice {
  created_at?: string;
  currency?: string;
  /** 状态 */
  enabled?: boolean;
  id?: number;
  /** 关联 */
  plan_id?: number;
  platform?: ModelsPaymentPlatform;
  /** 平台特定配置（JSONB） */
  platform_metadata?: string;
  /** 平台标识 */
  platform_price_id?: string;
  /** 价格信息 */
  price?: number;
  updated_at?: string;
}

export interface ModelsProviderKeyItem {
  api_key?: string;
  cost_rate?: number;
  enabled?: boolean;
  id?: number;
  note?: string;
  supported_models?: string;
  weight?: number;
}

export interface ModelsProviderKeysConfig {
  openai?: ModelsProviderKeysEntry;
  openrouter?: ModelsProviderKeysEntry;
}

export interface ModelsProviderKeysEntry {
  keys?: ModelsProviderKeyItem[];
}

export interface VoAIModelCreateRequest {
  /** Replaces BrandID */
  author: string;
  /** @min 0 */
  base_price_per_token_cached_input?: number;
  /**
   * Base Prices (OpenRouter reference)
   * @min 0
   */
  base_price_per_token_input?: number;
  /** @min 0 */
  base_price_per_token_output?: number;
  /** @min 0 */
  charge_per_token_cached_input?: number;
  /**
   * User Pricing
   * @min 0
   */
  charge_per_token_input?: number;
  /** @min 0 */
  charge_per_token_output?: number;
  code: string;
  /** @min 0 */
  context_length_limit?: number;
  /** JSONB */
  input_modalities?: string;
  model_description?: string;
  /** JSONB */
  output_modalities?: string;
  short_name?: string;
  supports_reasoning?: boolean;
}

export interface VoAIModelListResponse {
  items?: VoAIModelResponse[];
  pagination?: VoCommonPagination;
}

export interface VoAIModelResponse {
  author?: string;
  base_price_per_token_cached_input?: number;
  base_price_per_token_input?: number;
  base_price_per_token_output?: number;
  charge_per_token_cached_input?: number;
  charge_per_token_input?: number;
  charge_per_token_output?: number;
  code?: string;
  context_length_limit?: number;
  created_at?: string;
  id?: number;
  /** JSONB */
  input_modalities?: string;
  model_description?: string;
  /** JSONB */
  output_modalities?: string;
  short_name?: string;
  supports_reasoning?: boolean;
  updated_at?: string;
}

export interface VoAIModelUpdateRequest {
  author?: string;
  /** @min 0 */
  base_price_per_token_cached_input?: number;
  /** @min 0 */
  base_price_per_token_input?: number;
  /** @min 0 */
  base_price_per_token_output?: number;
  /** @min 0 */
  charge_per_token_cached_input?: number;
  /** @min 0 */
  charge_per_token_input?: number;
  /** @min 0 */
  charge_per_token_output?: number;
  code?: string;
  /** @min 0 */
  context_length_limit?: number;
  input_modalities?: string;
  model_description?: string;
  output_modalities?: string;
  short_name?: string;
  supports_reasoning?: boolean;
}

export interface VoAdminConnectorInstanceResponse {
  activePkgVersionID?: number;
  activeVersion?: string;
  createdAt?: string;
  embeddingSyncedVersion?: string;
  id?: number;
  instance_description?: string;
  name?: string;
  ownerID?: number;
  pkg_id?: string;
  status?: string;
  updatedAt?: string;
  visibility?: string;
}

export interface VoAdminConnectorPkgAuthorResponse {
  email?: string;
  id?: number;
  name?: string;
}

export interface VoAdminConnectorPkgResponse {
  author?: VoAdminConnectorPkgAuthorResponse;
  authorID?: number;
  createdAt?: string;
  iconUpdatedAt?: string;
  id?: string;
  name?: string;
  package_description?: string;
  updatedAt?: string;
  versions?: VoAdminConnectorPkgVersionResponse[];
}

export interface VoAdminConnectorPkgVersionResponse {
  authType?: string;
  bundleSize?: number;
  bundleURL?: string;
  createdAt?: string;
  iconURL?: string;
  id?: number;
  manifest?: string;
  pkg_id?: string;
  r2Path?: string;
  releaseNote?: string;
  toolCount?: number;
  uploadedBy?: number;
  version?: string;
}

export interface VoAdminCreditAdjustRequest {
  amount: number;
  owner_id: number;
  owner_type: VoAdminCreditAdjustRequestOwnerTypeEnum;
  /**
   * @minLength 1
   * @maxLength 500
   */
  reason: string;
}

export interface VoAdminCreditAdjustResponse {
  new_balance?: number;
  success?: boolean;
  transaction_id?: number;
}

export interface VoAdminUsageStatsResponse {
  available_credits?: number;
  end_date?: string;
  start_date?: string;
  team_id?: number;
  total_credits?: number;
  total_records?: number;
  user_id?: number;
}

export interface VoAdminUserDetailResponse {
  /** 用户可用的models（来自所属用户组） */
  available_models?: VoUserAvailableModelItem[];
  /** 最近20条支付与退款记录 */
  recent_payments?: VoPaymentTransactionResponse[];
  /** 最近20条订阅记录 */
  recent_subscriptions?: VoSubscriptionResponse[];
  /** 最近20条点数充值记录（CreditTransaction中TransactionType=PURCHASE） */
  recent_topups?: VoCreditTransactionResponse[];
  /** 最近20条点数消耗记录（UsageRecord） */
  recent_usage?: VoUsageRecordResponse[];
  user?: VoAdminUserResponse;
  /** 用户所属的用户组 */
  user_groups?: VoUserGroupResponse[];
}

export interface VoAdminUserListResponse {
  items?: VoAdminUserResponse[];
  pagination?: VoCommonPagination;
}

export interface VoAdminUserResponse {
  activated_at?: string;
  created_at?: string;
  email?: string;
  id?: number;
  invited_by?: string;
  is_activated?: boolean;
  name?: string;
  stripe_customer_id?: string;
  supabase_id?: string;
  user_code?: string;
}

export interface VoCommonPagination {
  page?: number;
  size?: number;
  total?: number;
}

export interface VoCreatePlatformPriceRequest {
  currency: string;
  plan_id: number;
  platform: ModelsPaymentPlatform;
  /** @min 0 */
  price: number;
}

export interface VoCreditBalanceItem {
  available?: number;
  credits_amount?: number;
  credits_type?: string;
  credits_used?: number;
  expire_at?: string;
  id?: number;
  /** 7天内过期 */
  is_expiring?: boolean;
}

export interface VoCreditBalanceResponse {
  /** 团队额度列表 */
  teams?: VoTeamCreditBalance[];
  user_balances?: VoCreditBalanceItem[];
  user_base?: number;
  user_topup?: number;
  /** 个人额度 */
  user_total?: number;
}

export interface VoCreditTransactionListResponse {
  pagination?: VoCommonPagination;
  transactions?: VoCreditTransactionResponse[];
}

export interface VoCreditTransactionResponse {
  amount?: number;
  balance_after?: number;
  balance_before?: number;
  created_at?: string;
  id?: number;
  owner_id?: number;
  owner_type?: string;
  reason?: string;
  transaction_type?: string;
}

export interface VoErrorResponse {
  error?: string;
  key?: string;
  status?: string;
}

export interface VoInvitationRelationListResponse {
  page?: number;
  page_size?: number;
  relations?: VoInvitationRelationResponse[];
  total?: number;
}

export interface VoInvitationRelationResponse {
  channel?: string;
  created_at?: string;
  id?: number;
  invite_code?: string;
  invitee?: VoInviteUserInfo;
  inviter?: VoInviteUserInfo;
  status?: string;
}

export interface VoInviteCodeListResponse {
  codes?: VoInviteCodeResponse[];
  page?: number;
  page_size?: number;
  total?: number;
}

export interface VoInviteCodeResponse {
  code?: string;
  created_at?: string;
  expired_at?: string;
  id?: number;
  max_use_count?: number;
  owner?: VoInviteUserInfo;
  status?: string;
  type?: string;
  used_count?: number;
}

export interface VoInviteUserInfo {
  email?: string;
  name?: string;
  user_id?: string;
}

export interface VoIssueInviteRequest {
  /** 可选：过期时间 */
  expired_at?: string;
  /** 每个码的使用次数（默认 1） */
  max_use_count?: number;
  /** @min 1 */
  quantity: number;
  /** 用户ID（必填） */
  target_user_id: string;
  /** 码类型（默认 limited） */
  type?: string;
}

export interface VoIssueInviteResponse {
  codes?: VoInviteCodeResponse[];
  target_user?: VoInviteUserInfo;
}

export interface VoModelCost {
  cache_read?: number;
  cache_write?: number;
  input?: number;
  input_audio?: number;
  output?: number;
  output_audio?: number;
  reasoning?: number;
}

export interface VoModelInfo {
  cost?: VoModelCost;
  description?: string;
  headers?: number[];
  id?: string;
  limit?: VoModelLimit;
  modalities?: VoModelModalities;
  name?: string;
  /** Passthrough for adapter use; cost is intentionally omitted from CDN. */
  options?: number[];
  provider?: number[];
  status?: string;
  variants?: number[];
}

export interface VoModelLimit {
  context?: number;
  input?: number;
  output?: number;
}

export interface VoModelModalities {
  input?: string[];
  output?: string[];
}

export interface VoPaymentTransactionResponse {
  amount?: number;
  created_at?: string;
  credits_amount?: number;
  currency?: string;
  id?: number;
  platform?: string;
  status?: string;
  stripe_payment_intent_id?: string;
  transaction_type?: string;
}

export interface VoPlanTypeListResponse {
  plan_types?: VoPlanTypeOption[];
}

export interface VoPlanTypeOption {
  allow_pay_and_go?: boolean;
  allow_sync_docs?: boolean;
  cloud_storage_size_mb?: number;
  code?: string;
  credits_expired_days?: number;
  credits_monthly?: number;
  name?: string;
}

export interface VoPlatformPriceListResponse {
  prices?: ModelsPlatformPrice[];
}

export interface VoProviderCatalogResponse {
  providers?: Record<string, VoProviderInfo>;
}

export interface VoProviderInfo {
  api?: string;
  description?: string;
  headers?: number[];
  models?: Record<string, VoModelInfo>;
  name?: string;
  npm?: string;
  options?: number[];
  variants?: number[];
}

export interface VoProviderKeyCreateRequest {
  api_key: string;
  cost_rate?: number;
  enabled?: boolean;
  note?: string;
  provider_code: string;
  supported_models: string;
  /** @min 0 */
  weight: number;
}

export interface VoProviderKeyListResponse {
  items?: VoProviderKeyResponse[];
}

export interface VoProviderKeyResponse {
  api_key?: string;
  cost_rate?: number;
  created_at?: string;
  enabled?: boolean;
  id?: number;
  note?: string;
  provider_code?: string;
  supported_models?: string;
  updated_at?: string;
  weight?: number;
}

export interface VoProviderKeyUpdateRequest {
  api_key?: string;
  cost_rate?: number;
  enabled?: boolean;
  note?: string;
  provider_code?: string;
  supported_models?: string;
  weight?: number;
}

export interface VoRawCatalogResponse {
  raw?: Record<string, VoRawProviderInfo>;
}

export interface VoRawModelInfo {
  attachment?: boolean;
  cost?: VoModelCost;
  family?: string;
  headers?: number[];
  id?: string;
  knowledge?: string;
  last_updated?: string;
  limit?: VoModelLimit;
  modalities?: VoModelModalities;
  name?: string;
  open_weights?: boolean;
  options?: number[];
  provider?: number[];
  reasoning?: boolean;
  release_date?: string;
  status?: string;
  structured_output?: boolean;
  temperature?: boolean;
  tool_call?: boolean;
  variants?: number[];
}

export interface VoRawProviderInfo {
  api?: string;
  doc?: string;
  env?: string[];
  id?: string;
  models?: Record<string, VoRawModelInfo>;
  name?: string;
  npm?: string;
}

export interface VoSubscriptionDetailResponse {
  app_store_transaction_id?: string;
  /** 基础额度（从配置读取） */
  base_credits?: number;
  billing_cycle?: string;
  created_at?: string;
  end_date?: string;
  google_play_order_id?: string;
  id?: number;
  payment_platform?: string;
  plan_type?: string;
  start_date?: string;
  status?: string;
  stripe_subscription_id?: string;
  subscriber_id?: number;
  subscriber_type?: string;
  updated_at?: string;
}

export interface VoSubscriptionListResponse {
  pagination?: VoCommonPagination;
  subscriptions?: VoSubscriptionResponse[];
}

export interface VoSubscriptionPlanCreateRequest {
  /**
   * BillingCycle 计费周期
   * @Description 计费周期
   * @Enum MONTHLY YEARLY
   */
  billing_cycle: VoSubscriptionPlanCreateRequestBillingCycleEnum;
  enabled?: boolean;
  name: string;
  plan_description?: string;
  /**
   * PlanType 计划类型
   * @Description 计划类型
   * @Enum STANDARD PREMIUM
   */
  plan_type: VoSubscriptionPlanCreateRequestPlanTypeEnum;
}

export interface VoSubscriptionPlanListResponse {
  items?: VoSubscriptionPlanResponse[];
  pagination?: VoCommonPagination;
}

export interface VoSubscriptionPlanResponse {
  billing_cycle?: string;
  created_at?: string;
  /** 从 platform_prices 查询（Stripe） */
  currency?: string;
  enabled?: boolean;
  id?: number;
  name?: string;
  plan_description?: string;
  plan_type?: string;
  /** 从 platform_prices 查询（Stripe） */
  price?: number;
  stripe_price_id?: string;
  updated_at?: string;
}

export interface VoSubscriptionPlanUpdateRequest {
  billing_cycle?: string;
  enabled?: boolean;
  name?: string;
  plan_description?: string;
  plan_type?: string;
}

export interface VoSubscriptionResponse {
  /** 基础额度（从配置读取） */
  base_credits?: number;
  billing_cycle?: string;
  created_at?: string;
  end_date?: string;
  id?: number;
  plan_type?: string;
  start_date?: string;
  status?: string;
  subscriber_id?: number;
  subscriber_type?: string;
  updated_at?: string;
}

export interface VoSuccessResponse {
  message?: string;
  success?: boolean;
}

export interface VoTeamCreditBalance {
  balances?: VoCreditBalanceItem[];
  team_id?: number;
  team_name?: string;
  total?: number;
}

export interface VoUpdateInviteCodeStatusRequest {
  /** active/disabled */
  status: string;
}

export interface VoUpdatePlatformPriceRequest {
  enabled?: boolean;
  price?: number;
}

export interface VoUsageRecordResponse {
  activity?: string;
  created_at?: string;
  id?: number;
  model?: string;
  provider?: string;
  total_credits?: number;
  total_tokens?: number;
}

export interface VoUserAvailableModelItem {
  author?: string;
  code?: string;
  id?: number;
  /** 来源用户组信息 */
  source_groups?: VoUserGroupResponse[];
  user_description?: string;
}

export interface VoUserGroupCreateRequest {
  group_description?: string;
  name: string;
}

export interface VoUserGroupListResponse {
  items?: VoUserGroupResponse[];
  pagination?: VoCommonPagination;
}

export interface VoUserGroupMemberItem {
  created_at?: string;
  user_id?: string;
}

export interface VoUserGroupResponse {
  auto_join?: boolean;
  created_at?: string;
  group_description?: string;
  id?: number;
  members?: VoUserGroupMemberItem[];
  name?: string;
  updated_at?: string;
}

export interface VoUserGroupUpdateRequest {
  /** 使用指针以区分零值和未设置 */
  auto_join?: boolean;
  group_description?: string;
  name?: string;
}

export enum VoAdminCreditAdjustRequestOwnerTypeEnum {
  USER = "USER",
  TEAM = "TEAM",
}

/**
 * BillingCycle 计费周期
 * @Description 计费周期
 * @Enum MONTHLY YEARLY
 */
export enum VoSubscriptionPlanCreateRequestBillingCycleEnum {
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

/**
 * PlanType 计划类型
 * @Description 计划类型
 * @Enum STANDARD PREMIUM
 */
export enum VoSubscriptionPlanCreateRequestPlanTypeEnum {
  STANDARD = "STANDARD",
  PREMIUM = "PREMIUM",
}

/** 所有者类型 */
export enum CreditsBalanceListParamsOwnerTypeEnum {
  USER = "USER",
  TEAM = "TEAM",
}

/** 所有者类型 */
export enum CreditsTransactionsListParamsOwnerTypeEnum {
  USER = "USER",
  TEAM = "TEAM",
}

/** 支付平台 */
export enum PlatformPricesListParamsPlatformEnum {
  STRIPE = "STRIPE",
  APP_STORE = "APP_STORE",
  GOOGLE_PLAY = "GOOGLE_PLAY",
}

/** 计划类型 */
export enum SubscriptionPlansListParamsPlanTypeEnum {
  STANDARD = "STANDARD",
  PREMIUM = "PREMIUM",
}

/** 计费周期 */
export enum SubscriptionPlansListParamsBillingCycleEnum {
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

/** 订阅状态 */
export enum SubscriptionsListParamsStatusEnum {
  TRIAL = "TRIAL",
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

/** 订阅者类型 */
export enum SubscriptionsListParamsSubscriberTypeEnum {
  USER = "USER",
  TEAM = "TEAM",
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
  admin = {
    /**
     * @description Get paginated list of AI models
     *
     * @tags Admin
     * @name AiModelsList
     * @summary List AI models
     * @request GET:/admin/ai-models
     * @secure
     */
    aiModelsList: (
      query?: {
        /**
         * Page number
         * @default 1
         */
        page?: number;
        /**
         * Page size
         * @default 20
         */
        page_size?: number;
        /** Filter by code or description */
        filter?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoAIModelListResponse, any>({
        path: `/admin/ai-models`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new AI model
     *
     * @tags Admin
     * @name AiModelsCreate
     * @summary Create AI model
     * @request POST:/admin/ai-models
     * @secure
     */
    aiModelsCreate: (request: VoAIModelCreateRequest, params: RequestParams = {}) =>
      this.request<VoAIModelResponse, VoErrorResponse>({
        path: `/admin/ai-models`,
        method: "POST",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get AI model by ID
     *
     * @tags Admin
     * @name AiModelsDetail
     * @summary Get AI model
     * @request GET:/admin/ai-models/{id}
     * @secure
     */
    aiModelsDetail: (id: number, params: RequestParams = {}) =>
      this.request<VoAIModelResponse, VoErrorResponse>({
        path: `/admin/ai-models/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update an AI model
     *
     * @tags Admin
     * @name AiModelsUpdate
     * @summary Update AI model
     * @request PUT:/admin/ai-models/{id}
     * @secure
     */
    aiModelsUpdate: (id: number, request: VoAIModelUpdateRequest, params: RequestParams = {}) =>
      this.request<VoAIModelResponse, VoErrorResponse>({
        path: `/admin/ai-models/${id}`,
        method: "PUT",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete an AI model (soft delete)
     *
     * @tags Admin
     * @name AiModelsDelete
     * @summary Delete AI model
     * @request DELETE:/admin/ai-models/{id}
     * @secure
     */
    aiModelsDelete: (id: number, params: RequestParams = {}) =>
      this.request<VoSuccessResponse, VoErrorResponse>({
        path: `/admin/ai-models/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get list of all AI providers available in the catalog
     *
     * @tags AdminBlacklist
     * @name AiProvidersList
     * @summary List AI providers
     * @request GET:/admin/ai-providers
     * @secure
     */
    aiProvidersList: (params: RequestParams = {}) =>
      this.request<AdminAdminAIProviderResponse[], VoErrorResponse>({
        path: `/admin/ai-providers`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get all models for a provider with their enabled/disabled status
     *
     * @tags AdminBlacklist
     * @name AiProvidersDetail
     * @summary Get provider models
     * @request GET:/admin/ai-providers/{providerId}
     * @secure
     */
    aiProvidersDetail: (providerId: string, params: RequestParams = {}) =>
      this.request<AdminAdminAIProviderModelListResponse, VoErrorResponse>({
        path: `/admin/ai-providers/${providerId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Enable or disable a model for a specific provider
     *
     * @tags AdminBlacklist
     * @name AiProvidersModelsUpdate
     * @summary Toggle model enabled state
     * @request PUT:/admin/ai-providers/{providerId}/models/{modelId}
     * @secure
     */
    aiProvidersModelsUpdate: (
      providerId: string,
      modelId: string,
      request: AdminAdminUpdateModelBlacklistRequest,
      params: RequestParams = {},
    ) =>
      this.request<VoSuccessResponse, VoErrorResponse>({
        path: `/admin/ai-providers/${providerId}/models/${modelId}`,
        method: "PUT",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员手动调整用户或团队的额度
     *
     * @tags Admin/Credit
     * @name CreditsAdjustCreate
     * @summary 管理员调整额度
     * @request POST:/admin/credits/adjust
     * @secure
     */
    creditsAdjustCreate: (request: VoAdminCreditAdjustRequest, params: RequestParams = {}) =>
      this.request<VoAdminCreditAdjustResponse, VoErrorResponse>({
        path: `/admin/credits/adjust`,
        method: "POST",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员查询指定用户或团队的额度余额
     *
     * @tags Admin/Credit
     * @name CreditsBalanceList
     * @summary 查询额度余额
     * @request GET:/admin/credits/balance
     * @secure
     */
    creditsBalanceList: (
      query: {
        /** 所有者类型 */
        owner_type: CreditsBalanceListParamsOwnerTypeEnum;
        /** 所有者ID */
        owner_id: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoCreditBalanceResponse, VoErrorResponse>({
        path: `/admin/credits/balance`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员查询指定用户或团队的额度交易记录
     *
     * @tags Admin/Credit
     * @name CreditsTransactionsList
     * @summary 查询额度交易记录
     * @request GET:/admin/credits/transactions
     * @secure
     */
    creditsTransactionsList: (
      query: {
        /** 所有者类型 */
        owner_type: CreditsTransactionsListParamsOwnerTypeEnum;
        /** 所有者ID */
        owner_id: number;
        /**
         * 页码
         * @default 1
         */
        page?: number;
        /**
         * 每页数量
         * @default 20
         */
        page_size?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoCreditTransactionListResponse, VoErrorResponse>({
        path: `/admin/credits/transactions`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Admin queries invite codes list
     *
     * @tags Admin/Invite
     * @name InviteCodesList
     * @summary Get invite codes list
     * @request GET:/admin/invite/codes
     * @secure
     */
    inviteCodesList: (
      query?: {
        /** 拥有者用户ID */
        owner_user_id?: number;
        /** 状态过滤 (active/disabled/expired) */
        status?: string;
        /**
         * 页码
         * @default 1
         */
        page?: number;
        /**
         * 每页数量
         * @default 20
         */
        page_size?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoInviteCodeListResponse, any>({
        path: `/admin/invite/codes`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Admin updates invite code status
     *
     * @tags Admin/Invite
     * @name InviteCodesStatusUpdate
     * @summary Update invite code status
     * @request PUT:/admin/invite/codes/{id}/status
     * @secure
     */
    inviteCodesStatusUpdate: (id: number, request: VoUpdateInviteCodeStatusRequest, params: RequestParams = {}) =>
      this.request<VoInviteCodeResponse, any>({
        path: `/admin/invite/codes/${id}/status`,
        method: "PUT",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Admin issues invite codes to a user
     *
     * @tags Admin/Invite
     * @name InviteIssueCreate
     * @summary Issue invite codes
     * @request POST:/admin/invite/issue
     * @secure
     */
    inviteIssueCreate: (request: VoIssueInviteRequest, params: RequestParams = {}) =>
      this.request<VoIssueInviteResponse, any>({
        path: `/admin/invite/issue`,
        method: "POST",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Admin queries invitation relations list
     *
     * @tags Admin/Invite
     * @name InviteRelationsList
     * @summary Get invitation relations list
     * @request GET:/admin/invite/relations
     * @secure
     */
    inviteRelationsList: (
      query?: {
        /** 邀请人ID */
        inviter_id?: string;
        /** 被邀请人ID */
        invitee_id?: string;
        /** 邀请码 */
        invite_code?: string;
        /**
         * 页码
         * @default 1
         */
        page?: number;
        /**
         * 每页数量
         * @default 20
         */
        page_size?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoInvitationRelationListResponse, any>({
        path: `/admin/invite/relations`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员查询平台价格列表
     *
     * @tags Admin/PlatformPrice
     * @name PlatformPricesList
     * @summary 列出平台价格
     * @request GET:/admin/platform-prices
     * @secure
     */
    platformPricesList: (
      query?: {
        /** 订阅计划ID */
        plan_id?: number;
        /** 支付平台 */
        platform?: PlatformPricesListParamsPlatformEnum;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoPlatformPriceListResponse, any>({
        path: `/admin/platform-prices`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员创建新的平台价格
     *
     * @tags Admin/PlatformPrice
     * @name PlatformPricesCreate
     * @summary 创建平台价格
     * @request POST:/admin/platform-prices
     * @secure
     */
    platformPricesCreate: (request: VoCreatePlatformPriceRequest, params: RequestParams = {}) =>
      this.request<ModelsPlatformPrice, any>({
        path: `/admin/platform-prices`,
        method: "POST",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员获取平台价格详情
     *
     * @tags Admin/PlatformPrice
     * @name PlatformPricesIdList
     * @summary 获取平台价格详情
     * @request GET:/admin/platform-prices/:id
     * @secure
     */
    platformPricesIdList: (id: number, params: RequestParams = {}) =>
      this.request<ModelsPlatformPrice, any>({
        path: `/admin/platform-prices/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员更新平台价格
     *
     * @tags Admin/PlatformPrice
     * @name PlatformPricesIdUpdate
     * @summary 更新平台价格
     * @request PUT:/admin/platform-prices/:id
     * @secure
     */
    platformPricesIdUpdate: (id: number, request: VoUpdatePlatformPriceRequest, params: RequestParams = {}) =>
      this.request<Record<string, string>, any>({
        path: `/admin/platform-prices/${id}`,
        method: "PUT",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员删除平台价格
     *
     * @tags Admin/PlatformPrice
     * @name PlatformPricesIdDelete
     * @summary 删除平台价格
     * @request DELETE:/admin/platform-prices/:id
     * @secure
     */
    platformPricesIdDelete: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, string>, any>({
        path: `/admin/platform-prices/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员禁用平台价格
     *
     * @tags Admin/PlatformPrice
     * @name PlatformPricesIdDisableCreate
     * @summary 禁用平台价格
     * @request POST:/admin/platform-prices/:id/disable
     * @secure
     */
    platformPricesIdDisableCreate: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, string>, any>({
        path: `/admin/platform-prices/${id}/disable`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get list of all AI providers and their models, filtered by blacklist and status
     *
     * @tags AdminProviderCatalog
     * @name ProviderCatalogPreviewList
     * @summary Preview provider catalog
     * @request GET:/admin/provider-catalog/preview
     * @secure
     */
    providerCatalogPreviewList: (params: RequestParams = {}) =>
      this.request<VoProviderCatalogResponse, VoErrorResponse>({
        path: `/admin/provider-catalog/preview`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Fetch models.dev (or use cache), apply blacklist/alpha/deprecated filter, upload to CDN (providers first, then index). Fails if another publish is in progress.
     *
     * @tags AdminProviderCatalog
     * @name ProviderCatalogPublishCreate
     * @summary Publish provider catalog to CDN
     * @request POST:/admin/provider-catalog/publish
     * @secure
     */
    providerCatalogPublishCreate: (body: AdminPublishProviderCatalogRequest, params: RequestParams = {}) =>
      this.request<AdminPublishProviderCatalogResponse, void | VoErrorResponse>({
        path: `/admin/provider-catalog/publish`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get unfiltered raw models.dev catalog
     *
     * @tags AdminProviderCatalog
     * @name ProviderCatalogRawList
     * @summary Get raw provider catalog
     * @request GET:/admin/provider-catalog/raw
     * @secure
     */
    providerCatalogRawList: (params: RequestParams = {}) =>
      this.request<VoRawCatalogResponse, VoErrorResponse>({
        path: `/admin/provider-catalog/raw`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get all provider keys
     *
     * @tags Admin
     * @name ProviderKeysList
     * @summary List provider keys
     * @request GET:/admin/provider-keys
     * @secure
     */
    providerKeysList: (params: RequestParams = {}) =>
      this.request<VoProviderKeyListResponse, VoErrorResponse>({
        path: `/admin/provider-keys`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new provider API key
     *
     * @tags Admin
     * @name ProviderKeysCreate
     * @summary Create provider key
     * @request POST:/admin/provider-keys
     * @secure
     */
    providerKeysCreate: (request: VoProviderKeyCreateRequest, params: RequestParams = {}) =>
      this.request<VoProviderKeyResponse, VoErrorResponse>({
        path: `/admin/provider-keys`,
        method: "POST",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Preview the PROVIDER_KEYS configuration that would be synced to Cloudflare
     *
     * @tags Admin
     * @name ProviderKeysConfigPreviewList
     * @summary Preview PROVIDER_KEYS config
     * @request GET:/admin/provider-keys-config/preview
     * @secure
     */
    providerKeysConfigPreviewList: (params: RequestParams = {}) =>
      this.request<ModelsProviderKeysConfig, VoErrorResponse>({
        path: `/admin/provider-keys-config/preview`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Sync the PROVIDER_KEYS configuration to Cloudflare Workers
     *
     * @tags Admin
     * @name ProviderKeysConfigSyncCreate
     * @summary Sync PROVIDER_KEYS config
     * @request POST:/admin/provider-keys-config/sync
     * @secure
     */
    providerKeysConfigSyncCreate: (params: RequestParams = {}) =>
      this.request<VoSuccessResponse, VoErrorResponse>({
        path: `/admin/provider-keys-config/sync`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update an existing provider API key
     *
     * @tags Admin
     * @name ProviderKeysUpdate
     * @summary Update provider key
     * @request PUT:/admin/provider-keys/{id}
     * @secure
     */
    providerKeysUpdate: (id: number, request: VoProviderKeyUpdateRequest, params: RequestParams = {}) =>
      this.request<VoProviderKeyResponse, VoErrorResponse>({
        path: `/admin/provider-keys/${id}`,
        method: "PUT",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a provider API key
     *
     * @tags Admin
     * @name ProviderKeysDelete
     * @summary Delete provider key
     * @request DELETE:/admin/provider-keys/{id}
     * @secure
     */
    providerKeysDelete: (id: number, params: RequestParams = {}) =>
      this.request<VoSuccessResponse, VoErrorResponse>({
        path: `/admin/provider-keys/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description List all connector packages with optional filters
     *
     * @tags Admin
     * @name RemoteTaskConnectorPkgsList
     * @summary List connector packages
     * @request GET:/admin/remote-task/connector-pkgs
     * @secure
     */
    remoteTaskConnectorPkgsList: (
      query?: {
        /** Filter by visibility (private/public) */
        visibility?: string;
        /** Filter by status (active/disabled) */
        status?: string;
        /** Filter by author ID */
        author_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoAdminConnectorPkgResponse[], VoErrorResponse>({
        path: `/admin/remote-task/connector-pkgs`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get detailed information about a connector package
     *
     * @tags Admin
     * @name RemoteTaskConnectorPkgsDetail
     * @summary Get connector package detail
     * @request GET:/admin/remote-task/connector-pkgs/{pkg_id}
     * @secure
     */
    remoteTaskConnectorPkgsDetail: (pkgId: string, params: RequestParams = {}) =>
      this.request<VoAdminConnectorPkgResponse, VoErrorResponse>({
        path: `/admin/remote-task/connector-pkgs/${pkgId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description List all connector instances using a specific package
     *
     * @tags Admin
     * @name RemoteTaskConnectorPkgsInstancesDetail
     * @summary List package instances
     * @request GET:/admin/remote-task/connector-pkgs/{pkg_id}/instances
     * @secure
     */
    remoteTaskConnectorPkgsInstancesDetail: (pkgId: string, params: RequestParams = {}) =>
      this.request<VoAdminConnectorInstanceResponse[], VoErrorResponse>({
        path: `/admin/remote-task/connector-pkgs/${pkgId}/instances`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update the status of a connector package (e.g., disable it)
     *
     * @tags Admin
     * @name RemoteTaskConnectorPkgsStatusUpdate
     * @summary Update package status
     * @request PUT:/admin/remote-task/connector-pkgs/{pkg_id}/status
     * @secure
     */
    remoteTaskConnectorPkgsStatusUpdate: (
      pkgId: string,
      request: AdminUpdatePkgStatusRequest,
      params: RequestParams = {},
    ) =>
      this.request<GinH, VoErrorResponse>({
        path: `/admin/remote-task/connector-pkgs/${pkgId}/status`,
        method: "PUT",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List all versions of a connector package
     *
     * @tags Admin
     * @name RemoteTaskConnectorPkgsVersionsDetail
     * @summary List package versions
     * @request GET:/admin/remote-task/connector-pkgs/{pkg_id}/versions
     * @secure
     */
    remoteTaskConnectorPkgsVersionsDetail: (pkgId: string, params: RequestParams = {}) =>
      this.request<VoAdminConnectorPkgVersionResponse[], VoErrorResponse>({
        path: `/admin/remote-task/connector-pkgs/${pkgId}/versions`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description List all connector instances with optional status filter
     *
     * @tags Admin
     * @name RemoteTaskInstancesList
     * @summary List connector instances
     * @request GET:/admin/remote-task/instances
     * @secure
     */
    remoteTaskInstancesList: (
      query?: {
        /** Filter by status (active/disabled/pending_review) */
        status?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoAdminConnectorInstanceResponse[], VoErrorResponse>({
        path: `/admin/remote-task/instances`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new connector instance (admin can create directly active)
     *
     * @tags Admin
     * @name RemoteTaskInstancesCreate
     * @summary Create connector instance
     * @request POST:/admin/remote-task/instances
     * @secure
     */
    remoteTaskInstancesCreate: (request: AdminCreateInstanceRequest, params: RequestParams = {}) =>
      this.request<VoAdminConnectorInstanceResponse, VoErrorResponse>({
        path: `/admin/remote-task/instances`,
        method: "POST",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get detailed information about a connector instance including statistics
     *
     * @tags Admin
     * @name RemoteTaskInstancesDetail
     * @summary Get connector instance detail
     * @request GET:/admin/remote-task/instances/{instance_id}
     * @secure
     */
    remoteTaskInstancesDetail: (instanceId: string, params: RequestParams = {}) =>
      this.request<VoAdminConnectorInstanceResponse, VoErrorResponse>({
        path: `/admin/remote-task/instances/${instanceId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update the configuration of a connector instance
     *
     * @tags Admin
     * @name RemoteTaskInstancesUpdate
     * @summary Update instance configuration
     * @request PUT:/admin/remote-task/instances/{instance_id}
     * @secure
     */
    remoteTaskInstancesUpdate: (instanceId: string, request: AdminCreateInstanceRequest, params: RequestParams = {}) =>
      this.request<VoAdminConnectorInstanceResponse, VoErrorResponse>({
        path: `/admin/remote-task/instances/${instanceId}`,
        method: "PUT",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a connector instance
     *
     * @tags Admin
     * @name RemoteTaskInstancesDelete
     * @summary Delete connector instance
     * @request DELETE:/admin/remote-task/instances/{instance_id}
     * @secure
     */
    remoteTaskInstancesDelete: (instanceId: string, params: RequestParams = {}) =>
      this.request<GinH, VoErrorResponse>({
        path: `/admin/remote-task/instances/${instanceId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Approve or reject a pending connector instance
     *
     * @tags Admin
     * @name RemoteTaskInstancesReviewUpdate
     * @summary Review connector instance
     * @request PUT:/admin/remote-task/instances/{instance_id}/review
     * @secure
     */
    remoteTaskInstancesReviewUpdate: (
      instanceId: string,
      request: AdminReviewInstanceRequest,
      params: RequestParams = {},
    ) =>
      this.request<GinH, VoErrorResponse>({
        path: `/admin/remote-task/instances/${instanceId}/review`,
        method: "PUT",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员查询所有订阅计划
     *
     * @tags Admin/SubscriptionPlan
     * @name SubscriptionPlansList
     * @summary 查询所有订阅计划
     * @request GET:/admin/subscription-plans
     * @secure
     */
    subscriptionPlansList: (
      query?: {
        /**
         * 页码
         * @default 1
         */
        page?: number;
        /**
         * 每页数量
         * @default 20
         */
        page_size?: number;
        /** 搜索关键词（名称、描述） */
        filter?: string;
        /** 计划类型 */
        plan_type?: SubscriptionPlansListParamsPlanTypeEnum;
        /** 计费周期 */
        billing_cycle?: SubscriptionPlansListParamsBillingCycleEnum;
        /** 是否启用 */
        enabled?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoSubscriptionPlanListResponse, VoErrorResponse>({
        path: `/admin/subscription-plans`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员创建新的订阅计划
     *
     * @tags Admin/SubscriptionPlan
     * @name SubscriptionPlansCreate
     * @summary 创建订阅计划
     * @request POST:/admin/subscription-plans
     * @secure
     */
    subscriptionPlansCreate: (request: VoSubscriptionPlanCreateRequest, params: RequestParams = {}) =>
      this.request<VoSubscriptionPlanResponse, VoErrorResponse>({
        path: `/admin/subscription-plans`,
        method: "POST",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员获取可用的订阅计划类型列表（排除 FREE）
     *
     * @tags Admin/SubscriptionPlan
     * @name SubscriptionPlansPlanTypesList
     * @summary 获取可用计划类型
     * @request GET:/admin/subscription-plans/plan-types
     * @secure
     */
    subscriptionPlansPlanTypesList: (params: RequestParams = {}) =>
      this.request<VoPlanTypeListResponse, any>({
        path: `/admin/subscription-plans/plan-types`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员查询订阅计划详细信息
     *
     * @tags Admin/SubscriptionPlan
     * @name SubscriptionPlansDetail
     * @summary 查询订阅计划详情
     * @request GET:/admin/subscription-plans/{id}
     * @secure
     */
    subscriptionPlansDetail: (id: number, params: RequestParams = {}) =>
      this.request<VoSubscriptionPlanResponse, VoErrorResponse>({
        path: `/admin/subscription-plans/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员更新订阅计划
     *
     * @tags Admin/SubscriptionPlan
     * @name SubscriptionPlansUpdate
     * @summary 更新订阅计划
     * @request PUT:/admin/subscription-plans/{id}
     * @secure
     */
    subscriptionPlansUpdate: (id: number, request: VoSubscriptionPlanUpdateRequest, params: RequestParams = {}) =>
      this.request<VoSubscriptionPlanResponse, VoErrorResponse>({
        path: `/admin/subscription-plans/${id}`,
        method: "PUT",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员删除订阅计划（软删除）
     *
     * @tags Admin/SubscriptionPlan
     * @name SubscriptionPlansDelete
     * @summary 删除订阅计划
     * @request DELETE:/admin/subscription-plans/{id}
     * @secure
     */
    subscriptionPlansDelete: (id: number, params: RequestParams = {}) =>
      this.request<VoSuccessResponse, VoErrorResponse>({
        path: `/admin/subscription-plans/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员查询所有订阅记录
     *
     * @tags Admin/Subscription
     * @name SubscriptionsList
     * @summary 查询所有订阅
     * @request GET:/admin/subscriptions
     * @secure
     */
    subscriptionsList: (
      query?: {
        /** 订阅状态 */
        status?: SubscriptionsListParamsStatusEnum;
        /** 订阅者类型 */
        subscriber_type?: SubscriptionsListParamsSubscriberTypeEnum;
        /** 用户ID（筛选用户订阅） */
        user_id?: number;
        /** 团队ID（筛选团队订阅） */
        team_id?: number;
        /**
         * 页码
         * @default 1
         */
        page?: number;
        /**
         * 每页数量
         * @default 20
         */
        page_size?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoSubscriptionListResponse, VoErrorResponse>({
        path: `/admin/subscriptions`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员查询订阅详细信息
     *
     * @tags Admin/Subscription
     * @name SubscriptionsDetail
     * @summary 查询订阅详情
     * @request GET:/admin/subscriptions/{id}
     * @secure
     */
    subscriptionsDetail: (id: number, params: RequestParams = {}) =>
      this.request<VoSubscriptionDetailResponse, VoErrorResponse>({
        path: `/admin/subscriptions/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员取消指定订阅
     *
     * @tags Admin/Subscription
     * @name SubscriptionsCancelCreate
     * @summary 取消订阅
     * @request POST:/admin/subscriptions/{id}/cancel
     * @secure
     */
    subscriptionsCancelCreate: (id: number, params: RequestParams = {}) =>
      this.request<VoSuccessResponse, VoErrorResponse>({
        path: `/admin/subscriptions/${id}/cancel`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员查询用户或团队的使用统计
     *
     * @tags Admin/Usage
     * @name UsageStatsList
     * @summary 查询使用统计
     * @request GET:/admin/usage/stats
     * @secure
     */
    usageStatsList: (
      query?: {
        /** 用户ID */
        user_id?: number;
        /** 团队ID */
        team_id?: number;
        /** 开始日期 (YYYY-MM-DD) */
        start_date?: string;
        /** 结束日期 (YYYY-MM-DD) */
        end_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoAdminUsageStatsResponse, VoErrorResponse>({
        path: `/admin/usage/stats`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get paginated list of user groups
     *
     * @tags Admin
     * @name UserGroupsList
     * @summary List user groups
     * @request GET:/admin/user-groups
     * @secure
     */
    userGroupsList: (
      query?: {
        /**
         * Page number
         * @default 1
         */
        page?: number;
        /**
         * Page size
         * @default 20
         */
        page_size?: number;
        /** Filter by name or description */
        filter?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoUserGroupListResponse, any>({
        path: `/admin/user-groups`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new user group
     *
     * @tags Admin
     * @name UserGroupsCreate
     * @summary Create user group
     * @request POST:/admin/user-groups
     * @secure
     */
    userGroupsCreate: (request: VoUserGroupCreateRequest, params: RequestParams = {}) =>
      this.request<VoUserGroupResponse, VoErrorResponse>({
        path: `/admin/user-groups`,
        method: "POST",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get user group by ID with members
     *
     * @tags Admin
     * @name UserGroupsDetail
     * @summary Get user group
     * @request GET:/admin/user-groups/{id}
     * @secure
     */
    userGroupsDetail: (id: number, params: RequestParams = {}) =>
      this.request<VoUserGroupResponse, VoErrorResponse>({
        path: `/admin/user-groups/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update a user group
     *
     * @tags Admin
     * @name UserGroupsUpdate
     * @summary Update user group
     * @request PUT:/admin/user-groups/{id}
     * @secure
     */
    userGroupsUpdate: (id: number, request: VoUserGroupUpdateRequest, params: RequestParams = {}) =>
      this.request<VoUserGroupResponse, VoErrorResponse>({
        path: `/admin/user-groups/${id}`,
        method: "PUT",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a user group (soft delete)
     *
     * @tags Admin
     * @name UserGroupsDelete
     * @summary Delete user group
     * @request DELETE:/admin/user-groups/{id}
     * @secure
     */
    userGroupsDelete: (id: number, params: RequestParams = {}) =>
      this.request<VoSuccessResponse, VoErrorResponse>({
        path: `/admin/user-groups/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员查询用户列表，支持按邮箱、UserCode搜索，支持激活状态过滤
     *
     * @tags Admin/User
     * @name UsersList
     * @summary 查询用户列表
     * @request GET:/admin/users
     * @secure
     */
    usersList: (
      query?: {
        /**
         * 页码
         * @default 1
         */
        page?: number;
        /**
         * 每页数量
         * @default 20
         */
        page_size?: number;
        /** 搜索关键词（邮箱、UserCode） */
        filter?: string;
        /** 激活状态过滤 (activated/not_activated) */
        activation_status?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<VoAdminUserListResponse, any>({
        path: `/admin/users`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 管理员查询用户详细信息，包含最近20条订阅、支付、充值、消耗记录
     *
     * @tags Admin/User
     * @name UsersDetail
     * @summary 查询用户详情
     * @request GET:/admin/users/{id}
     * @secure
     */
    usersDetail: (id: number, params: RequestParams = {}) =>
      this.request<VoAdminUserDetailResponse, any>({
        path: `/admin/users/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Admin manually activates a user without invite code
     *
     * @tags Admin/User
     * @name UsersActivateCreate
     * @summary Admin activate user
     * @request POST:/admin/users/{id}/activate
     * @secure
     */
    usersActivateCreate: (id: number, params: RequestParams = {}) =>
      this.request<GinH, any>({
        path: `/admin/users/${id}/activate`,
        method: "POST",
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get all user groups that a user belongs to
     *
     * @tags Admin
     * @name UsersGroupsDetail
     * @summary Get user's groups
     * @request GET:/admin/users/{id}/groups
     * @secure
     */
    usersGroupsDetail: (id: string, params: RequestParams = {}) =>
      this.request<VoUserGroupListResponse, VoErrorResponse>({
        path: `/admin/users/${id}/groups`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Add a user to a specific user group
     *
     * @tags Admin
     * @name UsersGroupsCreate
     * @summary Add user to group
     * @request POST:/admin/users/{id}/groups/{group_id}
     * @secure
     */
    usersGroupsCreate: (id: string, groupId: number, params: RequestParams = {}) =>
      this.request<VoSuccessResponse, VoErrorResponse>({
        path: `/admin/users/${id}/groups/${groupId}`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Remove a user from a specific user group
     *
     * @tags Admin
     * @name UsersGroupsDelete
     * @summary Remove user from group
     * @request DELETE:/admin/users/{id}/groups/{group_id}
     * @secure
     */
    usersGroupsDelete: (id: string, groupId: number, params: RequestParams = {}) =>
      this.request<VoSuccessResponse, VoErrorResponse>({
        path: `/admin/users/${id}/groups/${groupId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Admin resets user's MCP token
     *
     * @tags Admin/User
     * @name UsersResetMcpTokenCreate
     * @summary Reset MCP Token
     * @request POST:/admin/users/{id}/reset-mcp-token
     * @secure
     */
    usersResetMcpTokenCreate: (id: number, params: RequestParams = {}) =>
      this.request<GinH, any>({
        path: `/admin/users/${id}/reset-mcp-token`,
        method: "POST",
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
