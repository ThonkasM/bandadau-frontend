import { clearModelDownloaded, isModelDownloaded, markModelDownloaded } from './model-downloaded';

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

describe('model-downloaded', () => {
  it('remembers and clears the downloaded flag per model', async () => {
    expect(await isModelDownloaded('llama-3.2-1b-q')).toBe(false);
    await markModelDownloaded('llama-3.2-1b-q');
    expect(await isModelDownloaded('llama-3.2-1b-q')).toBe(true);
    expect(await isModelDownloaded('qwen3-0.6b-q')).toBe(false);
    await clearModelDownloaded('llama-3.2-1b-q');
    expect(await isModelDownloaded('llama-3.2-1b-q')).toBe(false);
  });
});
