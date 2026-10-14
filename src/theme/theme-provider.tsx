import {
  applyTheme,
  type EffectiveTheme,
  flatTokens,
  resolveEffectiveTheme,
  type ThemeName,
  type ThemePreference,
  type ThemeTokens,
  tokens,
} from '@bandada/ui-tokens';
import { vars } from 'nativewind';
import { createContext, type ReactNode,useContext, useMemo } from 'react';
import { Platform, useColorScheme, View } from 'react-native';

import { usePreferencesStore } from '@/stores/preferences.store';

interface ThemeContextValue {
  preference: ThemePreference;
  effective: EffectiveTheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Builds the NativeWind CSS-variable style for the effective theme (semantic tokens only). */
function buildThemeVars(theme: ThemeName) {
  const flat = flatTokens[theme] as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(flat)) {
    if (typeof value === 'string' || typeof value === 'number') {
      out[`--bd-${name.replace(/\./g, '-')}`] = String(value);
    }
  }
  return vars(out);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const preference = usePreferencesStore((s) => s.theme);
  const setPreference = usePreferencesStore((s) => s.setTheme);

  const effective = resolveEffectiveTheme(preference, systemScheme === 'dark');

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    applyTheme(effective, document as never);
  }

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, effective, setPreference }),
    [preference, effective, setPreference],
  );
  const themeVars = useMemo(() => buildThemeVars(effective), [effective]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVars]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/** Semantic tokens for the effective theme (use where `className` does not apply). */
export function useTokens(): ThemeTokens {
  const { effective } = useTheme();
  return tokens[effective];
}
