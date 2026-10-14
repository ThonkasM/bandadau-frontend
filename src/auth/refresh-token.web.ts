/**
 * Web: the refresh token is an HttpOnly cookie set by the server
 * (`seguridad-y-sso.md`); JS never sees it and requests use `credentials: 'include'`.
 */
export async function getRefreshToken(): Promise<string | null> {
  return null;
}

export async function setRefreshToken(): Promise<void> {
  // no-op: the cookie is managed by the server
}

export async function clearRefreshToken(): Promise<void> {
  // no-op: cleared by `POST /auth/logout`
}
