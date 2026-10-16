import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { Persister } from '@tanstack/react-query-persist-client';

interface SyncStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const memory: Record<string, string> = {};
const fallback: SyncStorage = {
  getItem: (key) => memory[key] ?? null,
  setItem: (key, value) => {
    memory[key] = value;
  },
  removeItem: (key) => {
    delete memory[key];
  },
};

function safeStorage(): SyncStorage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Web: persist the query cache in `localStorage` (SSR falls back to memory). */
export const queryPersister: Persister = createSyncStoragePersister({
  storage: safeStorage() ?? fallback,
  key: 'bandada.query',
});
