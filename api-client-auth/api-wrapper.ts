/* eslint-disable */
/* tslint:disable */
import { Api as GeneratedApi } from './api.js'

export class ApiError extends Error {
  public readonly key?: string
  public readonly traceId?: string
  public readonly statusCode?: number

  constructor(message: string, key?: string, traceId?: string, statusCode?: number) {
    super(message)
    this.name = 'ApiError'
    this.key = key
    this.traceId = traceId
    this.statusCode = statusCode
  }
}

type UnwrapMethod<F> = F extends (...args: infer A) => Promise<infer R>
  ? (...args: A) => Promise<R extends { data: infer D } ? D : R>
  : F

type UnwrapNamespace<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => Promise<any>
    ? UnwrapMethod<T[K]>
    : T[K] extends object
    ? UnwrapNamespace<T[K]>
    : T[K]
}

function unwrapResponse<T>(resp: unknown): T {
  const response = resp as { data?: any; status?: number }
  const body = response?.data ?? response
  if (body?.error) {
    throw new ApiError(
      body.error.message || 'API Error',
      body.error.key,
      body.trace_id,
      response?.status
    )
  }
  return (body?.data ?? body) as T
}

function wrapObject<T extends object>(obj: T): UnwrapNamespace<T> {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const value = (obj as Record<string, unknown>)[key]
    if (typeof value === 'function') {
      out[key] = async (...args: unknown[]) => {
        try {
          const resp = await (value as (...a: unknown[]) => Promise<unknown>)(...args)
          return unwrapResponse<unknown>(resp)
        } catch (err) {
          const e = err as { response?: { data?: any; status?: number }; message?: string }
          const data = e?.response?.data
          if (data?.error) {
            throw new ApiError(
              data.error.message || e.message || 'API Error',
              data.error.key,
              data.trace_id,
              e.response?.status
            )
          }
          throw err
        }
      }
      continue
    }
    if (value && typeof value === 'object') {
      out[key] = wrapObject(value as object)
      continue
    }
    out[key] = value
  }
  return out as UnwrapNamespace<T>
}

export function createApi(config: ConstructorParameters<typeof GeneratedApi<any>>[0]): UnwrapNamespace<GeneratedApi<any>> {
  const api = new GeneratedApi<any>(config)
  return wrapObject(api)
}

export * from './api.js'
