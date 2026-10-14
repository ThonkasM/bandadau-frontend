import { type Locale,SUPPORTED_LOCALES } from '@bandada/i18n';
import type { ThemePreference } from '@bandada/ui-tokens';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { openAdminPanel } from '@/auth/handoff';
import { logout } from '@/auth/session';
import { Screen } from '@/components/screens/screen';
import { useUpdatePreferences } from '@/features/auth/api';
import { usePreferencesStore } from '@/stores/preferences.store';
import { hasPanelAccess, useSessionStore } from '@/stores/session.store';
import { useTokens } from '@/theme/theme-provider';

const THEME_OPTIONS: ThemePreference[] = ['SYSTEM', 'LIGHT', 'DARK'];

export default function SettingsScreen() {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('nav');
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const locale = usePreferencesStore((s) => s.locale);
  const setLocale = usePreferencesStore((s) => s.setLocale);
  const updatePreferences = useUpdatePreferences();

  const authenticated = Boolean(user);

  const onTheme = async (next: ThemePreference) => {
    setTheme(next);
    if (authenticated) updatePreferences.mutate({ theme: next });
  };

  const onLocale = async (next: Locale) => {
    setLocale(next);
    await i18n.changeLanguage(next);
    if (authenticated) updatePreferences.mutate({ locale: next });
  };

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <Screen title={t('settings')}>
      <Text style={[styles.section, { color: tokens.color.text.muted }]}>{t('menu')}</Text>
      <View style={styles.row}>
        {THEME_OPTIONS.map((option) => (
          <Pressable
            key={option}
            onPress={() => onTheme(option)}
            style={[
              styles.chip,
              { borderColor: tokens.color.border.default },
              theme === option && { backgroundColor: tokens.color.bg.muted },
            ]}>
            <Text style={{ color: tokens.color.text.primary }}>{option}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        {SUPPORTED_LOCALES.map((option) => (
          <Pressable
            key={option}
            onPress={() => onLocale(option)}
            style={[
              styles.chip,
              { borderColor: tokens.color.border.default },
              locale === option && { backgroundColor: tokens.color.bg.muted },
            ]}>
            <Text style={{ color: tokens.color.text.primary }}>{option}</Text>
          </Pressable>
        ))}
      </View>

      {hasPanelAccess(user?.roles) && (
        <Pressable
          onPress={openAdminPanel}
          style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
          <Text style={{ color: tokens.color.action.primary.fg }}>{t('openPanel')}</Text>
        </Pressable>
      )}

      {authenticated && (
        <Pressable
          onPress={onLogout}
          style={[styles.button, { backgroundColor: tokens.color.action.secondary.bg }]}>
          <Text style={{ color: tokens.color.action.secondary.fg }}>{t('backToApp')}</Text>
        </Pressable>
      )}

      <Pressable onPress={() => router.back()} style={styles.link}>
        <Text style={{ color: tokens.color.text.link }}>{t('backToApp')}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 8 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  link: { marginTop: 12 },
});
