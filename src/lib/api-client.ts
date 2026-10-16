import { Platform } from 'react-native';

import { clearRefreshToken, getRefreshToken, setRefreshToken } from '@/auth/refresh-token';
import type { AuthTokens } from '@/features/auth/types';
import { ApiError } from '@/lib/api-error';
import { buildHeaders, buildUrl, type RequestOptions } from '@/lib/http';
import { randomIdempotencyKey } from '@/lib/idempotency';
import { newCorrelationId } from '@/lib/ids';
import { resolveMock } from '@/mocks';
import { usePreferencesStore } from '@/stores/preferences.store';
import { useSessionStore } from '@/stores/session.store';

function currentLocale(): string {
  return usePreferencesStore.getState().locale;
}

async function rawFetch(
  path: string,
  options: RequestOptions,
  accessToken: string | null,
): Promise<Response> {
  const headers = buildHeaders({ ...options, accessToken }, newCorrelationId());
  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    credentials: Platform.OS === 'web' ? 'include' : 'omit',
  });
}

/** Parses a `Retry-After` header (delta-seconds or HTTP-date) into seconds. */
function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;
  return Math.max(0, Math.round((date - Date.now()) / 1000));
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function doRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (Platform.OS !== 'web' && !refreshToken) return null;

  let res: Response;
  try {
    res = await rawFetch(
      '/api/v1/auth/refresh',
      { method: 'POST', body: refreshToken ? { refreshToken } : {}, locale: currentLocale() },
      null,
    );
  } catch {
    // Backend unreachable (offline / wrong URL) → treat as no session, don't crash.
    return null;
  }

  if (!res.ok) {
    await clearRefreshToken();
    useSessionStore.getState().clear();
    return null;
  }

  const data = (await res.json()) as AuthTokens;
  if (data.refreshToken) await setRefreshToken(data.refreshToken);
  useSessionStore.getState().setSession({ accessToken: data.accessToken, user: data.user });
  return data.accessToken;
}

/** Forces a refresh (used on app start and by the 401 interceptor). */
export async function refreshSession(): Promise<boolean> {
  return Boolean(await refreshAccessToken());
}

export interface ApiMeta<T> {
  data: T;
  /** Seconds suggested by `Retry-After` (SAGA polling), or `null`. */
  retryAfter: number | null;
}

/** Single HTTP entrypoint for the app. Never call `fetch` directly from the UI. */
async function send<T>(path: string, options: RequestOptions = {}): Promise<ApiMeta<T>> {
  const method = options.method ?? 'GET';
  const mock = resolveMock(
    method,
    path,
    options.query as Record<string, unknown> | undefined,
    options.body,
  );
  if (mock) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (mock.status >= 400) throw ApiError.fromUnknown(mock.status, mock.body);
    return { data: mock.body as T, retryAfter: null };
  }

  const auth = options.auth !== false;
  // Freeze the idempotency key so retries reuse it (never regenerate on retry).
  // `locale` (Accept-Language) is always applied, in every branch.
  const frozen: RequestOptions = {
    ...options,
    locale: options.locale ?? currentLocale(),
    ...(options.idempotent && !options.idempotencyKey
      ? { idempotencyKey: randomIdempotencyKey() }
      : {}),
  };

  let accessToken = auth ? useSessionStore.getState().accessToken : null;
  let res = await rawFetch(path, frozen, accessToken);

  if (res.status === 401 && auth) {
    accessToken = await refreshAccessToken();
    if (accessToken) res = await rawFetch(path, frozen, accessToken);
  }

  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, await safeJson(res));
  }
  const retryAfter = parseRetryAfter(res.headers.get('Retry-After'));
  if (res.status === 204) return { data: undefined as T, retryAfter };
  return { data: (await res.json()) as T, retryAfter };
}

/** Standard request: returns the parsed body. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return (await send<T>(path, options)).data;
}

/** Request that also exposes `Retry-After` (SAGA polling). */
export async function apiRequestMeta<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiMeta<T>> {
  return send<T>(path, options);
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}
