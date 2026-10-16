import { storage } from '@/lib/storage';

import type { LocalModelId } from './local-llm';

/**
 * Remembers, across app restarts, that a model was fully downloaded. The runtime cache is
 * persistent (DocumentDir, not evicted), but the library exposes no "is downloaded?" check on
 * native, so we keep our own flag to restore the `ready` state without ever downloading on its own
 * (UC-17 RNF-11: the download is on demand).
 */
const key = (id: LocalModelId): string => `assistant.model.${id}.downloaded`;

export async function markModelDownloaded(id: LocalModelId): Promise<void> {
  await storage.setItem(key(id), '1');
}

export async function isModelDownloaded(id: LocalModelId): Promise<boolean> {
  return (await storage.getItem(key(id))) === '1';
}

export async function clearModelDownloaded(id: LocalModelId): Promise<void> {
  await storage.removeItem(key(id));
}
