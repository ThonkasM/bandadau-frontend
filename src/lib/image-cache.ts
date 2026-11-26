import type { ImageSource } from 'expo-image';

/**
 * Presigned S3 URLs change on every API response (new signature/expiry), so the default cache key
 * (the full URL) never hits and the same photo is downloaded again each time. The object key in the
 * path is immutable (write-once), so the URL without its query string is a stable cache key.
 */
export function stableImageKey(url: string): string {
  const queryStart = url.indexOf('?');
  return queryStart === -1 ? url : url.slice(0, queryStart);
}

/** `expo-image` source with a signature-independent disk cache key. */
export function cachedSource(url: string | null | undefined): ImageSource | undefined {
  return url ? { uri: url, cacheKey: stableImageKey(url) } : undefined;
}
