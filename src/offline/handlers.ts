import { apiRequest } from '@/lib/api-client';

import type { OutboxItem } from './outbox';

/** Sends one queued item. `clientId` (in the body) dedupes server-side; the idempotency key is reused. */
export async function processOutboxItem(item: OutboxItem): Promise<void> {
  if (item.kind === 'CREATE_POST') {
    await apiRequest('/api/v1/posts', {
      method: 'POST',
      body: item.payload,
      idempotencyKey: item.idempotencyKey,
    });
  }
}
