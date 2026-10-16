// @testing-library/react-native v14 includes its Jest matchers automatically,
// so there is nothing to extend here. Kept as the Jest setup entrypoint.

// `expo-crypto` is not backed by a real implementation under jest-expo; provide a small pure-JS mock.
jest.mock('expo-crypto', () => ({
  randomUUID: () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }),
  getRandomBytes: (count: number) => {
    const bytes = new Uint8Array(count);
    for (let i = 0; i < count; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    return bytes;
  },
}));

export {};
