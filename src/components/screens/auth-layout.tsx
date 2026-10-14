import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandHero } from '@/components/brand/brand-hero';
import { useTokens } from '@/theme/theme-provider';

export interface AuthLayoutProps {
  children: ReactNode;
  heroSubtitle?: string;
  heroHeight?: number;
}

/**
 * Auth screen layout: branded hero on top (respecting the top safe-area inset)
 * and a centered, scrollable, keyboard-aware form below (respecting the bottom
 * inset). Used by login, register and verify-email.
 */
export function AuthLayout({ children, heroSubtitle, heroHeight = 180 }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();
  const tokens = useTokens();

  return (
    <View style={[styles.root, { backgroundColor: tokens.color.bg.canvas }]}>
      <BrandHero height={heroHeight} subtitle={heroSubtitle} paddingTop={insets.top} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: 24 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  form: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 24 },
  inner: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: 16 },
});
