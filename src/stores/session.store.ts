import { create } from 'zustand';

import type { Role } from '@/lib/roles';

export interface SessionUser {
  id: string;
  displayName: string;
  email: string;
  roles: Role[];
  universityId: string;
  locale: string;
  theme: string;
}

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated';

interface SessionState {
  status: SessionStatus;
  /** Access token lives only in memory (never persisted). */
  accessToken: string | null;
  user: SessionUser | null;
  setSession: (session: { accessToken: string; user: SessionUser }) => void;
  setStatus: (status: SessionStatus) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  accessToken: null,
  user: null,
  setSession: ({ accessToken, user }) => set({ status: 'authenticated', accessToken, user }),
  setStatus: (status) => set({ status }),
  clear: () => set({ status: 'anonymous', accessToken: null, user: null }),
}));

export function hasPanelAccess(roles: readonly Role[] | undefined): boolean {
  return Boolean(roles?.some((role) => role === 'MODERATOR' || role === 'ADMIN'));
}
