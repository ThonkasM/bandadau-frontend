import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTokens } from '@/theme/theme-provider';

export interface ScreenProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

/** Base screen: canvas background, safe top inset and a title. Tokens only. */
export function Screen({ title, subtitle, children }: ScreenProps) {
  const tokens = useTokens();
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: tokens.color.bg.canvas }]}>
      <View style={styles.body}>
        <Text style={[styles.title, { color: tokens.color.text.primary }]}>{title}</Text>
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
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 15 },
});
