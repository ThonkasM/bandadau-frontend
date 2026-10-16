import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { Persister } from '@tanstack/react-query-persist-client';

import { storage } from '@/lib/storage';

/** Base persister (overridden by `.native.ts` / `.web.ts`). */
export const queryPersister: Persister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
  },
  key: 'bandada.query',
});
