import type { SessionUser } from '@/stores/session.store';

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user: SessionUser;
}
