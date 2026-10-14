import { env } from '@/lib/env';

import { mockFeed } from './feed';
import { mockNotifications } from './notifications';

export interface MockResult {
  status: number;
  body: unknown;
}

interface MockRoute {
  method: string;
  match: (path: string) => boolean;
  handle: (path: string, query?: Record<string, unknown>) => MockResult;
}

const routes: MockRoute[] = [
  {
    method: 'GET',
    match: (p) => p === '/api/v1/feed',
    handle: (_p, query) => ({ status: 200, body: mockFeed(query) }),
  },
  {
    method: 'GET',
    match: (p) => p === '/api/v1/notifications',
    handle: () => ({ status: 200, body: mockNotifications() }),
  },
  {
    method: 'POST',
    match: (p) => /^\/api\/v1\/notifications\/[^/]+\/read$/.test(p),
    handle: () => ({ status: 204, body: undefined }),
  },
  {
    method: 'POST',
    match: (p) => p === '/api/v1/notifications/read-all',
    handle: () => ({ status: 204, body: undefined }),
  },
];

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
  const route = routes.find((r) => r.method === method && r.match(path));
  return route?.handle(path, query);
}
