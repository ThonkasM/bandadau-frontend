import * as SecureStore from 'expo-secure-store';

import type { KeyValueStorage } from './storage';

/** Native storage: Keychain (iOS) / Keystore (Android). Used for preferences and refresh token. */
export const storage: KeyValueStorage = {
  async getItem(key) {
    return SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key) {
    await SecureStore.deleteItemAsync(key);
  },
};
