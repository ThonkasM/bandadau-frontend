import { openHandoffUrl } from '@/auth/open-url';
import { createPkcePair } from '@/auth/pkce';
import { applyAuthSession } from '@/auth/session';
import type { AuthTokens, HandoffCode } from '@/features/auth/types';
import { apiRequest } from '@/lib/api-client';

/**
 * UC-03 app → panel: generate a PKCE pair, request a handoff code and open the
 * panel with the verifier in the URL fragment (`#cv=…`, never in the query).
 */
export async function openAdminPanel(): Promise<void> {
  const { verifier, challenge, method } = await createPkcePair();
  const result = await apiRequest<HandoffCode>('/api/v1/auth/handoff', {
    method: 'POST',
    body: { targetApp: 'ADMIN', codeChallenge: challenge, codeChallengeMethod: method },
  });
  await openHandoffUrl(`${result.redirectUrl}#cv=${verifier}`);
}

/** UC-03 panel → app callback: extract `code` (query) and `cv` (fragment). */
export function parseHandoffCallback(url: string): { code?: string; verifier?: string } {
  const hashIndex = url.indexOf('#');
  const beforeHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const fragment = hashIndex >= 0 ? url.slice(hashIndex + 1) : '';
  const queryIndex = beforeHash.indexOf('?');
  const query = queryIndex >= 0 ? beforeHash.slice(queryIndex + 1) : '';
  return { code: readParam(query, 'code'), verifier: readParam(fragment, 'cv') };
}

function readParam(source: string, key: string): string | undefined {
  for (const pair of source.split('&')) {
    const eq = pair.indexOf('=');
    if (eq < 0) continue;
    if (decodeURIComponent(pair.slice(0, eq)) === key) {
      return decodeURIComponent(pair.slice(eq + 1));
    }
  }
  return undefined;
}

export async function exchangeHandoffCode(code: string, codeVerifier: string): Promise<void> {
  const tokens = await apiRequest<AuthTokens>('/api/v1/auth/handoff/exchange', {
    method: 'POST',
    auth: false,
    body: { code, codeVerifier },
  });
  await applyAuthSession(tokens);
}
