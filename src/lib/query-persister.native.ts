import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { Persister } from '@tanstack/react-query-persist-client';
import Storage from 'expo-sqlite/kv-store';

/** Native: persist the query cache in SQLite (expo-sqlite key-value store). */
export const queryPersister: Persister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => Storage.getItem(key),
    setItem: (key, value) => Storage.setItem(key, value),
    removeItem: (key) => Storage.removeItem(key),
  },
  key: 'bandada.query',
});
