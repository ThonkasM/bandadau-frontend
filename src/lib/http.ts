import { env } from '@/lib/env';
import { randomIdempotencyKey } from '@/lib/idempotency';

/** Builds headers shared by every request (the single HTTP chokepoint). */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  auth?: boolean;
  /** When true (♻️ endpoints) an `Idempotency-Key` is generated once per call. */
  idempotent?: boolean;
  idempotencyKey?: string;
  signal?: AbortSignal;
  accessToken?: string | null;
  locale?: string;
}

export function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = path.startsWith('http') ? path : `${env.apiUrl}${path}`;
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${base}${base.includes('?') ? '&' : '?'}${qs}` : base;
}

export function buildHeaders(options: RequestOptions, correlationId: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Correlation-Id': correlationId,
    'X-Bandada-Client': 'native',
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.locale ? { 'Accept-Language': options.locale } : {}),
    ...(options.auth && options.accessToken
      ? { Authorization: `Bearer ${options.accessToken}` }
      : {}),
    ...(options.idempotent || options.idempotencyKey
      ? { 'Idempotency-Key': options.idempotencyKey ?? randomIdempotencyKey() }
      : {}),
    ...options.headers,
  };
  return headers;
}
