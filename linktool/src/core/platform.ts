import type { LinktoolCoreContext } from './types.js';

type FetchImpl = typeof fetch;

export type PublishOptions = {
  payload?: Record<string, unknown>;
};

export type DeployOptions = {
  payload?: Record<string, unknown>;
};

export type ListKind = 'connectors' | 'versions';

export type ListOptions = {
  kind: ListKind;
  query?: Record<string, string>;
};

export type ConnectionCreateOptions = {
  connectorId: string;
  label?: string;
};

export type ConnectionListOptions = {};

export type ConnectionDeleteOptions = {
  connectionId: string;
};

export type PublishRuntime = {
  baseUrl: string;
  accessToken: string;
  publishPath: string;
  deployPath?: string;
  listPath?: string;
};

export type ConnectionRuntime = {
  baseUrl: string;
  accessToken: string;
  connectionsPath: string;
};

type PlatformDeps = {
  fetchImpl?: FetchImpl;
  resolvePublishRuntime?: (ctx: LinktoolCoreContext) => Promise<PublishRuntime> | PublishRuntime;
  resolveConnectionRuntime?: (ctx: LinktoolCoreContext) => Promise<ConnectionRuntime> | ConnectionRuntime;
};

export async function runPublish(
  ctx: LinktoolCoreContext,
  options: PublishOptions,
  deps: PlatformDeps = {},
): Promise<unknown> {
  const runtime = await requirePublishRuntime(ctx, deps);
  return requestJSON(deps.fetchImpl ?? fetch, runtime.baseUrl, runtime.publishPath, runtime.accessToken, {
    method: 'POST',
    body: options.payload ?? {},
  });
}

export async function runDeploy(
  ctx: LinktoolCoreContext,
  options: DeployOptions,
  deps: PlatformDeps = {},
): Promise<unknown> {
  const runtime = await requirePublishRuntime(ctx, deps);
  return requestJSON(deps.fetchImpl ?? fetch, runtime.baseUrl, runtime.deployPath ?? '', runtime.accessToken, {
    method: 'POST',
    body: options.payload ?? {},
  });
}

export async function runList(
  ctx: LinktoolCoreContext,
  options: ListOptions,
  deps: PlatformDeps = {},
): Promise<unknown> {
  const runtime = await requirePublishRuntime(ctx, deps);
  const defaultListPath = runtime.publishPath.replace(/\/publish$/, '/versions');
  const listPath =
    options.kind === 'versions'
      ? runtime.listPath ?? defaultListPath
      : (runtime.listPath ?? defaultListPath).replace(/\/versions$/, '/connectors');

  return requestJSON(deps.fetchImpl ?? fetch, runtime.baseUrl, withQuery(listPath, options.query), runtime.accessToken, {
    method: 'GET',
  });
}

export async function runConnectionCreate(
  ctx: LinktoolCoreContext,
  options: ConnectionCreateOptions,
  deps: PlatformDeps = {},
): Promise<unknown> {
  const connectorId = String(options.connectorId ?? '').trim();
  if (!connectorId) throw new Error('missing --connector-id');
  const runtime = await requireConnectionRuntime(ctx, deps);
  return requestJSON(deps.fetchImpl ?? fetch, runtime.baseUrl, runtime.connectionsPath, runtime.accessToken, {
    method: 'POST',
    body: {
      connector_id: connectorId,
      label: String(options.label ?? '').trim(),
    },
  });
}

export async function runConnectionList(
  ctx: LinktoolCoreContext,
  _options: ConnectionListOptions,
  deps: PlatformDeps = {},
): Promise<unknown> {
  const runtime = await requireConnectionRuntime(ctx, deps);
  return requestJSON(deps.fetchImpl ?? fetch, runtime.baseUrl, runtime.connectionsPath, runtime.accessToken, {
    method: 'GET',
  });
}

export async function runConnectionDelete(
  ctx: LinktoolCoreContext,
  options: ConnectionDeleteOptions,
  deps: PlatformDeps = {},
): Promise<unknown> {
  const connectionId = String(options.connectionId ?? '').trim();
  if (!connectionId) throw new Error('missing --connection-id');
  const runtime = await requireConnectionRuntime(ctx, deps);
  return requestJSON(
    deps.fetchImpl ?? fetch,
    runtime.baseUrl,
    `${runtime.connectionsPath}/${encodeURIComponent(connectionId)}`,
    runtime.accessToken,
    {
      method: 'DELETE',
    },
  );
}

async function requirePublishRuntime(ctx: LinktoolCoreContext, deps: PlatformDeps): Promise<PublishRuntime> {
  const runtime = await deps.resolvePublishRuntime?.(ctx);
  if (!runtime) throw new Error('Missing publish runtime');
  return runtime;
}

async function requireConnectionRuntime(ctx: LinktoolCoreContext, deps: PlatformDeps): Promise<ConnectionRuntime> {
  const runtime = await deps.resolveConnectionRuntime?.(ctx);
  if (!runtime) throw new Error('Missing connection runtime');
  return runtime;
}

async function requestJSON(
  fetchImpl: FetchImpl,
  baseUrl: string,
  path: string,
  accessToken: string,
  options: {
    method: 'GET' | 'POST' | 'DELETE';
    body?: Record<string, unknown>;
  },
): Promise<unknown> {
  const response = await fetchImpl(`${normalizeBaseUrl(baseUrl)}${path}`, {
    method: options.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.method === 'GET' ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (payload as any)?.error?.message ?? (payload as any)?.message ?? `request failed: ${response.status}`;
    throw new Error(String(message));
  }
  return unwrapPinResponse(payload);
}

function normalizeBaseUrl(value: string): string {
  const normalized = String(value ?? '').trim().replace(/\/+$/, '');
  if (!normalized) throw new Error('Missing base url');
  return normalized;
}

function unwrapPinResponse(payload: unknown): unknown {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}

function withQuery(pathname: string, query: Record<string, string> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const next = String(value ?? '').trim();
    if (!next) continue;
    params.set(key, next);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
