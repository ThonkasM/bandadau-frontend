import { clearRefreshToken, getRefreshToken, setRefreshToken } from '@/auth/refresh-token';
import type { AuthTokens } from '@/features/auth/types';
import { apiRequest, refreshSession } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import { useSessionStore } from '@/stores/session.store';

/** Persists tokens + session after a successful login/verify/refresh-exchange. */
export async function applyAuthSession(tokens: AuthTokens): Promise<void> {
  if (tokens.refreshToken) await setRefreshToken(tokens.refreshToken);
  useSessionStore.getState().setSession({ accessToken: tokens.accessToken, user: tokens.user });
}

/** Restores the session on cold start (native: stored refresh; web: HttpOnly cookie). */
export async function restoreSession(): Promise<void> {
  const ok = await refreshSession();
  if (!ok) useSessionStore.getState().setStatus('anonymous');
}

/** UC-02 logout: revoke family server-side, then clear local state. */
export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  try {
    await apiRequest('/api/v1/auth/logout', {
      method: 'POST',
      auth: true,
      body: refreshToken ? { refreshToken } : {},
    });
  } catch {
    // Offline logout: local state is cleared regardless (UC-02 C2a).
  } finally {
    await clearRefreshToken();
    queryClient.clear();
    useSessionStore.getState().clear();
  }
}
