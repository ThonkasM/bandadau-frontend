import type { TopUpPackage } from '@/features/wallet/types';
import { env } from '@/lib/env';

import { mockEvent, mockEvents, mockRegister } from './events';
import { mockFeed } from './feed';
import { mockGroups } from './groups';
import { mockNotifications } from './notifications';
import { mockMyProfile, mockUpdateProfile } from './profile';
import { mockTicket, mockTickets } from './tickets';
import { mockCreateTopUp, mockLedger, mockWallet } from './wallet';

export interface MockResult {
  status: number;
  body: unknown;
}

interface MockRoute {
  method: string;
  match: RegExp | string;
  handle: (path: string, query?: Record<string, unknown>, body?: unknown) => MockResult;
}

const ok = (body: unknown): MockResult => ({ status: 200, body });
const noContent: MockResult = { status: 204, body: undefined };

const routes: MockRoute[] = [
  // Identity / profile
  { method: 'GET', match: '/api/v1/profiles/me', handle: () => ok(mockMyProfile()) },
  { method: 'PATCH', match: '/api/v1/profiles/me', handle: () => ok(mockUpdateProfile()) },
  // Feed
  { method: 'GET', match: '/api/v1/feed', handle: (_p, query) => ok(mockFeed(query)) },
  // Notifications
  { method: 'GET', match: '/api/v1/notifications', handle: () => ok(mockNotifications()) },
  { method: 'POST', match: /^\/api\/v1\/notifications\/[^/]+\/read$/, handle: () => noContent },
  { method: 'POST', match: '/api/v1/notifications/read-all', handle: () => noContent },
  // Events
  { method: 'GET', match: '/api/v1/events', handle: () => ok(mockEvents()) },
  { method: 'GET', match: /^\/api\/v1\/events\/[^/]+$/, handle: (path) => ok(mockEvent(lastSegment(path))) },
  {
    method: 'POST',
    match: /^\/api\/v1\/events\/[^/]+\/registrations$/,
    handle: (path) => ({ status: 201, body: mockRegister(path.split('/').slice(-2)[0] ?? '') }),
  },
  // Wallet
  { method: 'GET', match: '/api/v1/wallet/me', handle: () => ok(mockWallet()) },
  { method: 'GET', match: '/api/v1/wallet/me/entries', handle: () => ok(mockLedger()) },
  {
    method: 'POST',
    match: '/api/v1/wallet/topups',
    handle: (_p, _q, body) => {
      const pkg = (body as { package?: TopUpPackage } | undefined)?.package ?? 'CREDITS_50';
      return { status: 201, body: mockCreateTopUp(pkg) };
    },
  },
  { method: 'POST', match: /^\/api\/v1\/wallet\/topups\/[^/]+\/simulate-payment$/, handle: () => noContent },
  // Tickets (specific before dynamic)
  { method: 'GET', match: '/api/v1/tickets/me', handle: () => ok(mockTickets()) },
  { method: 'GET', match: /^\/api\/v1\/tickets\/[^/]+$/, handle: (path) => ok(mockTicket(lastSegment(path))) },
  // Groups
  { method: 'GET', match: '/api/v1/groups', handle: () => ok(mockGroups()) },
  { method: 'POST', match: /^\/api\/v1\/groups\/[^/]+\/join$/, handle: () => ok(mockGroups().items[0]) },
];

function lastSegment(path: string): string {
  return path.split('/').filter(Boolean).slice(-1)[0] ?? '';
}

/**
 * Local fixtures for services that do not exist yet (Fase 1 substitutes, see
 * `fase-1-alcance-y-contrato-local.md`). Only active with `EXPO_PUBLIC_USE_MOCKS`.
 */
export function resolveMock(
  method: string,
  path: string,
  query?: Record<string, unknown>,
  body?: unknown,
): MockResult | undefined {
  if (!env.useMocks) return undefined;
  const route = routes.find(
    (r) => r.method === method && (typeof r.match === 'string' ? r.match === path : r.match.test(path)),
  );
  return route?.handle(path, query, body);
}
