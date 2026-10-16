import { randomIdempotencyKey } from './idempotency';

describe('randomIdempotencyKey', () => {
  it('returns a UUID-shaped key', () => {
    expect(randomIdempotencyKey()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('is unique per call (no collisions in a batch)', () => {
    const keys = new Set(Array.from({ length: 50 }, () => randomIdempotencyKey()));
    expect(keys.size).toBe(50);
  });
});
