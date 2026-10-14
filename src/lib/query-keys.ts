/**
 * Central TanStack Query key factory. Calling a factory without parameters
 * returns the root key so the whole branch can be invalidated at once.
 */
export const queryKeys = {
  me: () => ['me'] as const,
  universities: () => ['universities'] as const,
  profile: {
    root: () => ['profile'] as const,
    me: () => ['profile', 'me'] as const,
    byId: (id: string) => ['profile', id] as const,
  },
  feed: {
    root: () => ['feed'] as const,
    home: () => ['feed', 'home'] as const,
  },
  events: {
    root: () => ['events'] as const,
    list: (filters?: Record<string, unknown>) => ['events', 'list', filters ?? {}] as const,
    byId: (id: string) => ['events', id] as const,
  },
  registrations: {
    root: () => ['registrations'] as const,
    mine: () => ['registrations', 'me'] as const,
    byId: (id: string) => ['registrations', id] as const,
  },
  wallet: {
    root: () => ['wallet'] as const,
    me: () => ['wallet', 'me'] as const,
    entries: () => ['wallet', 'entries'] as const,
  },
  tickets: {
    root: () => ['tickets'] as const,
    mine: () => ['tickets', 'me'] as const,
    byId: (id: string) => ['tickets', id] as const,
  },
  notifications: {
    root: () => ['notifications'] as const,
    list: () => ['notifications', 'list'] as const,
  },
} as const;
