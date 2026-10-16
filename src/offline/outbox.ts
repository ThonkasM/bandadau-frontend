import { storage } from '@/lib/storage';

export type OutboxStatus = 'PENDING' | 'NEEDS_ATTENTION';
export type OutboxKind = 'CREATE_POST';

/** A queued mutation: `clientId` + `idempotencyKey` are generated once and reused on retries. */
export interface OutboxItem {
  id: string;
  clientId: string;
  idempotencyKey: string;
  kind: OutboxKind;
  payload: unknown;
  attempts: number;
  status: OutboxStatus;
  lastError?: string;
  createdAt: string;
}

export const MAX_ATTEMPTS = 5;
const KEY = 'bandada.outbox';

async function readAll(): Promise<OutboxItem[]> {
  const raw = await storage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OutboxItem[];
  } catch {
    return [];
  }
}

async function writeAll(items: OutboxItem[]): Promise<void> {
  await storage.setItem(KEY, JSON.stringify(items));
}

export async function listOutbox(): Promise<OutboxItem[]> {
  return readAll();
}

export async function enqueue(item: OutboxItem): Promise<void> {
  await writeAll([...(await readAll()), item]);
}

export async function removeFromOutbox(id: string): Promise<void> {
  await writeAll((await readAll()).filter((item) => item.id !== id));
}

/** Increments `attempts`; after `MAX_ATTEMPTS` the item becomes `NEEDS_ATTENTION`. */
export async function recordFailure(id: string, error: string): Promise<void> {
  const items = await readAll();
  await writeAll(
    items.map((item) => {
      if (item.id !== id) return item;
      const attempts = item.attempts + 1;
      return {
        ...item,
        attempts,
        lastError: error,
        status: attempts >= MAX_ATTEMPTS ? 'NEEDS_ATTENTION' : 'PENDING',
      };
    }),
  );
}

/** Exponential backoff for the retry loop (1 s, 2 s, 4 s… capped at 60 s). */
export function backoffMs(attempts: number): number {
  return Math.min(60_000, 2 ** attempts * 1000);
}
