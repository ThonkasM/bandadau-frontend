import { env } from '@/lib/env';

import { mockFeed } from './feed';

export interface MockResult {
  status: number;
  body: unknown;
}

/**
 * Local fixtures for services that do not exist yet (Fase 1 substitutes, see
 * `fase-1-alcance-y-contrato-local.md`). Only active with `EXPO_PUBLIC_USE_MOCKS`.
 */
export function resolveMock(
  method: string,
  path: string,
  query?: Record<string, unknown>,
): MockResult | undefined {
  if (!env.useMocks) return undefined;
  if (method === 'GET' && path === '/api/v1/feed') {
    return { status: 200, body: mockFeed(query) };
  }
  return undefined;
}
