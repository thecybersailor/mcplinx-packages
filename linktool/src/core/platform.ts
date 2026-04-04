import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LinktoolCoreContext } from './types.js';
import { getPackageName } from '../lib/package-name.js';

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
  uploadPath?: string;
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
  const fetchImpl = deps.fetchImpl ?? fetch;
  const payload = normalizePublishPayload(ctx.cwd, options.payload);
  const artifacts = readPublishArtifacts(ctx.cwd);
  const uploadPath = runtime.uploadPath ?? runtime.publishPath.replace(/\/publish$/, '/upload-url');

  const uploadResponse = await requestJSON(fetchImpl, runtime.baseUrl, uploadPath, runtime.accessToken, {
    method: 'POST',
    body: {
      name: payload.name,
      files: ['bundle.js', 'manifest.json'],
    },
  });

  const uploadUrls = readUploadUrls(uploadResponse);
  await uploadArtifact(fetchImpl, uploadUrls['bundle.js'], artifacts.bundle, 'application/javascript');
  await uploadArtifact(fetchImpl, uploadUrls['manifest.json'], artifacts.manifest, 'application/json');

  return requestJSON(deps.fetchImpl ?? fetch, runtime.baseUrl, runtime.publishPath, runtime.accessToken, {
    method: 'POST',
    body: payload,
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
  const query =
    options.kind === 'versions'
      ? {
          ...(options.query ?? {}),
          connector_id: String(options.query?.connector_id ?? '').trim() || getPackageName(ctx.cwd),
        }
      : (options.query ?? {});

  return requestJSON(deps.fetchImpl ?? fetch, runtime.baseUrl, withQuery(listPath, query), runtime.accessToken, {
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

async function uploadArtifact(
  fetchImpl: FetchImpl,
  url: string,
  body: string | Uint8Array,
  contentType: string,
): Promise<void> {
  const response = await fetchImpl(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: body as BodyInit,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `artifact upload failed: ${response.status}`);
  }
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

function normalizePublishPayload(cwd: string, payload: Record<string, unknown> = {}): Record<string, unknown> {
  const input = { ...payload };
  const resolvedName = resolvePublishName(cwd, input);
  delete input.connectorKey;
  return {
    ...input,
    name: resolvedName,
  };
}

function resolvePublishName(cwd: string, payload: Record<string, unknown>): string {
  const directName = String(payload.name ?? '').trim();
  if (directName) return directName;
  const legacyKey = String(payload.connectorKey ?? '').trim();
  if (legacyKey) return legacyKey;
  return getPackageName(cwd);
}

function readPublishArtifacts(cwd: string): { bundle: Uint8Array; manifest: string } {
  const distDir = join(cwd, 'dist');
  const bundlePath = join(distDir, 'bundle.js');
  const manifestPath = join(distDir, 'manifest.json');
  if (!existsSync(bundlePath) || !existsSync(manifestPath)) {
    throw new Error('build artifacts not found: run `syntool build` first');
  }
  return {
    bundle: new Uint8Array(readFileSync(bundlePath)),
    manifest: readFileSync(manifestPath, 'utf-8'),
  };
}

function readUploadUrls(payload: unknown): Record<string, string> {
  const uploadUrls = (payload as { upload_urls?: unknown })?.upload_urls;
  if (!uploadUrls || typeof uploadUrls !== 'object') {
    throw new Error('upload-url response missing upload_urls');
  }
  const bundleUrl = String((uploadUrls as Record<string, unknown>)['bundle.js'] ?? '').trim();
  const manifestUrl = String((uploadUrls as Record<string, unknown>)['manifest.json'] ?? '').trim();
  if (!bundleUrl || !manifestUrl) {
    throw new Error('upload-url response missing bundle.js or manifest.json');
  }
  return {
    'bundle.js': bundleUrl,
    'manifest.json': manifestUrl,
  };
}
