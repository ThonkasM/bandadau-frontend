import * as Crypto from 'expo-crypto';

/** Idempotency keys are generated once per intent and reused on every retry. */
export function randomIdempotencyKey(): string {
  return Crypto.randomUUID();
}
