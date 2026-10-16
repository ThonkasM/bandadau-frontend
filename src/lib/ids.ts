import * as Crypto from 'expo-crypto';

export function newUuid(): string {
  return Crypto.randomUUID();
}

export function newCorrelationId(): string {
  return Crypto.randomUUID();
}

/**
 * UUIDv7 (time-ordered) generated on-device. Used as the post `clientId` (unique per
 * author, dedupe for the offline queue, D3/RF-08).
 */
export function newClientId(): string {
  const bytes = new Uint8Array(Crypto.getRandomBytes(16));
  let ms = Date.now();
  for (let i = 5; i >= 0; i -= 1) {
    bytes[i] = ms % 256;
    ms = Math.floor(ms / 256);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant RFC 4122
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
