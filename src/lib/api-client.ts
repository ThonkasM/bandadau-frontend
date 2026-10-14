import { Platform } from 'react-native';

import { clearRefreshToken, getRefreshToken, setRefreshToken } from '@/auth/refresh-token';
import type { AuthTokens } from '@/features/auth/types';
import { ApiError } from '@/lib/api-error';
import { buildHeaders, buildUrl, type RequestOptions } from '@/lib/http';
import { randomIdempotencyKey } from '@/lib/idempotency';
import { newCorrelationId } from '@/lib/ids';
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

  const res = await rawFetch(
    '/api/v1/auth/refresh',
    { method: 'POST', body: refreshToken ? { refreshToken } : {}, locale: currentLocale() },
    null,
  );

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

/** Single HTTP entrypoint for the app. Never call `fetch` directly from the UI. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth !== false;
  // Freeze the idempotency key so retries reuse it (never regenerate on retry).
  const frozen: RequestOptions =
    options.idempotent && !options.idempotencyKey
      ? { ...options, idempotencyKey: randomIdempotencyKey() }
      : { ...options, locale: options.locale ?? currentLocale() };

  let accessToken = auth ? useSessionStore.getState().accessToken : null;
  let res = await rawFetch(path, frozen, accessToken);

  if (res.status === 401 && auth) {
    accessToken = await refreshAccessToken();
    if (accessToken) res = await rawFetch(path, frozen, accessToken);
  }

  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, await safeJson(res));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}
