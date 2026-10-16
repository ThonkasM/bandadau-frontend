import { type Locale,SUPPORTED_LOCALES } from '@bandada/i18n';
import type { ThemePreference } from '@bandada/ui-tokens';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useUpdatePreferences } from '@/features/auth/api';
import { MenuHeader } from '@/features/profile/components/menu-header';
import { usePreferencesStore } from '@/stores/preferences.store';
import { useSessionStore } from '@/stores/session.store';
import { useTokens } from '@/theme/theme-provider';

const THEME_OPTIONS: ThemePreference[] = ['SYSTEM', 'LIGHT', 'DARK'];
const THEME_LABEL_KEY: Record<ThemePreference, string> = {
  SYSTEM: 'themeSystem',
  LIGHT: 'themeLight',
  DARK: 'themeDark',
};

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  const tokens = useTokens();
  return (
    <View style={[styles.segmented, { borderColor: tokens.color.border.default }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && { backgroundColor: tokens.color.bg.muted }]}>
            <Text
              numberOfLines={1}
              style={[
                styles.segmentLabel,
                { color: active ? tokens.color.text.primary : tokens.color.text.muted },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Settings shown inside the profile menu (theme + language), with a back header. */
export function SettingsMenuContent({
  onBack,
  onClose,
}: {
  onBack: () => void;
  onClose: () => void;
}) {
  const tokens = useTokens();
  const { t, i18n } = useTranslation(['nav', 'app']);
  const user = useSessionStore((s) => s.user);
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const locale = usePreferencesStore((s) => s.locale);
  const setLocale = usePreferencesStore((s) => s.setLocale);
  const updatePreferences = useUpdatePreferences();

  const authenticated = Boolean(user);

  const onTheme = (next: ThemePreference) => {
    setTheme(next);
    if (authenticated) updatePreferences.mutate({ theme: next });
  };

  const onLocale = async (next: Locale) => {
    setLocale(next);
    await i18n.changeLanguage(next);
    if (authenticated) updatePreferences.mutate({ locale: next });
  };

  return (
    <View style={styles.wrap}>
      <MenuHeader title={t('nav:settings')} onBack={onBack} onClose={onClose} />

      <Text style={[styles.section, { color: tokens.color.text.muted }]}>{t('nav:theme')}</Text>
      <Segmented
        value={theme}
        onChange={onTheme}
        options={THEME_OPTIONS.map((option) => ({
          value: option,
          label: t(`nav:${THEME_LABEL_KEY[option]}`),
        }))}
      />

      <Text style={[styles.section, { color: tokens.color.text.muted }]}>{t('nav:language')}</Text>
      <Segmented
        value={locale}
        onChange={onLocale}
        options={SUPPORTED_LOCALES.map((option) => ({
          value: option,
          label: t(option === 'es' ? 'nav:localeEs' : 'nav:localeEn'),
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingVertical: 8 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    marginTop: 8,
    marginBottom: 6,
  },
  segmented: { flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, overflow: 'hidden' },
  segment: { flex: 1, paddingVertical: 9, alignItems: 'center', paddingHorizontal: 4 },
  segmentLabel: { fontSize: 13, fontWeight: '600' },
});
