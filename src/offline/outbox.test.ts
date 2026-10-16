import { enqueue, listOutbox, MAX_ATTEMPTS, recordFailure } from './outbox';

jest.mock('@/lib/storage', () => {
  const memory = new Map<string, string>();
  return {
    storage: {
      getItem: async (key: string) => memory.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: async (key: string) => {
        memory.delete(key);
      },
    },
  };
});

describe('outbox', () => {
  it('keeps the same clientId/idempotencyKey and flags NEEDS_ATTENTION after MAX_ATTEMPTS', async () => {
    await enqueue({
      id: 'item-1',
      clientId: 'client-1',
      idempotencyKey: 'key-1',
      kind: 'CREATE_POST',
      payload: { text: 'hola' },
      attempts: 0,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });

    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      await recordFailure('item-1', 'offline');
    }

    const [item] = await listOutbox();
    expect(item?.attempts).toBe(MAX_ATTEMPTS);
    expect(item?.status).toBe('NEEDS_ATTENTION');
    expect(item?.clientId).toBe('client-1');
    expect(item?.idempotencyKey).toBe('key-1');
  });
});
