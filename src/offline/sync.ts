import NetInfo from '@react-native-community/netinfo';

import { listOutbox, type OutboxItem,recordFailure, removeFromOutbox } from './outbox';

export type OutboxHandler = (item: OutboxItem) => Promise<void>;

let draining = false;

/** Drains the pending outbox items (only when connected). */
export async function drainOutbox(handler: OutboxHandler): Promise<void> {
  if (draining) return;
  draining = true;
  try {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;
    for (const item of await listOutbox()) {
      if (item.status !== 'PENDING') continue;
      try {
        await handler(item);
        await removeFromOutbox(item.id);
      } catch (error) {
        await recordFailure(item.id, error instanceof Error ? error.message : String(error));
      }
    }
  } finally {
    draining = false;
  }
}

/** Starts the outbox sync (on start + whenever connectivity returns). Returns the cleanup. */
export function startOutboxSync(handler: OutboxHandler): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) void drainOutbox(handler);
  });
  void drainOutbox(handler);
  return unsubscribe;
}
