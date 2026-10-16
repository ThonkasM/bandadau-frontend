/**
 * Web: serialize the token refresh across tabs with the Web Locks API
 * (`seguridad-y-sso.md` §4). The refresh token is a single rotating cookie shared
 * by every tab: if two tabs present the same token at once, the server treats the
 * second as reuse and revokes the whole family (`REFRESH_TOKEN_REUSED`), logging
 * everyone out. Holding `bandada-refresh` while the `POST /auth/refresh` runs makes
 * the second tab wait, then refresh with the cookie the first tab just rotated.
 *
 * Not every context has Web Locks (e.g. non-secure origins): fall back to running
 * the task directly — the per-context single-flight in `api-client` still applies.
 */
const LOCK_NAME = 'bandada-refresh';

export function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks) return task();
  return locks.request(LOCK_NAME, () => task()) as Promise<T>;
}
