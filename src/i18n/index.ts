import { FALLBACK_LOCALE, type Locale,resolveLocale } from '@bandada/i18n';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';

import { resources } from '@/i18n/resources';
import { usePreferencesStore } from '@/stores/preferences.store';

export const DEFAULT_NS = 'app';
export const NAMESPACES = [
  'app',
  'auth',
  'nav',
  'feed',
  'notifications',
  'common',
  'enums',
  'errors',
] as const;

/** i18n.md §2: user locale → stored choice → device language → `es`. */
export function resolveDeviceLocale(userLocale?: string | null): Locale {
  const systemLocales = getLocales().map((entry) => entry.languageTag);
  return resolveLocale({
    userLocale,
    storedLocale: usePreferencesStore.getState().locale,
    systemLocales,
  });
}

export async function initI18n(): Promise<typeof i18n> {
  if (i18n.isInitialized) return i18n;

  await i18n
    .use(ICU)
    .use(initReactI18next)
    .init({
      resources,
      lng: resolveDeviceLocale(),
      fallbackLng: FALLBACK_LOCALE,
      defaultNS: DEFAULT_NS,
      ns: NAMESPACES as unknown as string[],
      interpolation: { escapeValue: false },
      returnNull: false,
    });

  return i18n;
}

export function getActiveLanguage(): string {
  return i18n.language;
}

export default i18n;
