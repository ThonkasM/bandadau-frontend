import { storage } from '@/lib/storage';

const REFRESH_KEY = 'bandada.refresh';

/** Native: refresh token in the secure store. */
export async function getRefreshToken(): Promise<string | null> {
  return storage.getItem(REFRESH_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  await storage.setItem(REFRESH_KEY, token);
}

export async function clearRefreshToken(): Promise<void> {
  await storage.removeItem(REFRESH_KEY);
}
