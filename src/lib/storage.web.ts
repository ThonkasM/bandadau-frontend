import type { KeyValueStorage } from './storage';

function safeLocalStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Web storage: `localStorage` (only for non-secret preferences; tokens use memory/cookies). */
export const storage: KeyValueStorage = {
  async getItem(key) {
    return safeLocalStorage()?.getItem(key) ?? null;
  },
  async setItem(key, value) {
    safeLocalStorage()?.setItem(key, value);
  },
  async removeItem(key) {
    safeLocalStorage()?.removeItem(key);
  },
};
