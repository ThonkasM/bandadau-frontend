/** Web: available storage from the StorageManager estimate (quota − usage). */
export async function availableBytes(): Promise<number | null> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage?.estimate) return null;
  try {
    const { quota = 0, usage = 0 } = await storage.estimate();
    return quota - usage;
  } catch {
    return null;
  }
}
