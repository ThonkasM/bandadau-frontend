import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTokens } from '@/theme/theme-provider';

export interface ScreenProps {
  title?: string;
  subtitle?: string;
  /** Horizontal padding + top padding for the default chrome (disable for edge-to-edge feeds). */
  padded?: boolean;
  children?: ReactNode;
}

/** Base screen: canvas background, safe top inset and an optional title. Tokens only. */
export function Screen({ title, subtitle, padded = true, children }: ScreenProps) {
  const tokens = useTokens();
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: tokens.color.bg.canvas }]}>
      <View style={[styles.body, !padded && styles.bodyFlush]}>
        {title ? (
          <Text style={[styles.title, { color: tokens.color.text.primary }]}>{title}</Text>
        ) : null}
        {subtitle ? (
          <Text style={[styles.subtitle, { color: tokens.color.text.muted }]}>{subtitle}</Text>
        ) : null}
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 24, gap: 8 },
  bodyFlush: { paddingHorizontal: 0, paddingTop: 0 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 15 },
});
