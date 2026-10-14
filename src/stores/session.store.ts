import { create } from 'zustand';

import type { AuthUser, Role } from '@/features/auth/types';

export type SessionUser = AuthUser;
export type SessionStatus = 'loading' | 'anonymous' | 'authenticated';

const NOW = new Date().toISOString();

/** Placeholder user for "continue as guest" (mockups / no restrictions yet). */
const GUEST_USER: SessionUser = {
  id: 'guest',
  email: 'invitado@bandada.local',
  emailVerifiedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
  locale: 'es',
  roles: ['STUDENT'],
  status: 'ACTIVE',
  theme: 'SYSTEM',
  universityId: '',
};

interface SessionState {
  status: SessionStatus;
  /** Access token lives only in memory (never persisted). */
  accessToken: string | null;
  user: SessionUser | null;
  /** True when the session was opened as a guest (no real account). */
  guest: boolean;
  setSession: (session: { accessToken: string; user: SessionUser }) => void;
  loginAsGuest: () => void;
  setStatus: (status: SessionStatus) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  accessToken: null,
  user: null,
  guest: false,
  setSession: ({ accessToken, user }) =>
    set({ status: 'authenticated', accessToken, user, guest: false }),
  loginAsGuest: () =>
    set({ status: 'authenticated', accessToken: null, user: GUEST_USER, guest: true }),
  setStatus: (status) => set({ status }),
  clear: () => set({ status: 'anonymous', accessToken: null, user: null, guest: false }),
}));

export function hasPanelAccess(roles: readonly Role[] | undefined): boolean {
  return Boolean(roles?.some((role) => role === 'MODERATOR' || role === 'ADMIN'));
}
