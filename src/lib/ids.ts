import * as Crypto from 'expo-crypto';

export function newUuid(): string {
  return Crypto.randomUUID();
}

export function newCorrelationId(): string {
  return Crypto.randomUUID();
}
