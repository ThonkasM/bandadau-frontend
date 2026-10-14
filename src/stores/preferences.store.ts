import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_LOCALE, type Locale } from '@bandada/i18n';
import type { ThemePreference } from '@bandada/ui-tokens';

import { storage } from '@/lib/storage';

interface PreferencesState {
  theme: ThemePreference;
  locale: Locale;
  setTheme: (theme: ThemePreference) => void;
  setLocale: (locale: Locale) => void;
}

/**
 * Device preferences (theme + locale). With an active session they are also
 * synced to the account via `PATCH /users/me/preferences` (UC-04).
 */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'SYSTEM',
      locale: DEFAULT_LOCALE,
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'bandada.preferences',
      storage: createJSONStorage(() => storage),
    },
  ),
);
