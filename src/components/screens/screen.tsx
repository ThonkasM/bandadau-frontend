import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTokens } from '@/theme/theme-provider';

export interface ScreenProps {
  title?: string;
  subtitle?: string;
  /** Horizontal padding + top padding for the default chrome (disable for edge-to-edge feeds). */
  padded?: boolean;
  /** Show a back button next to the title (secondary screens). */
  showBack?: boolean;
  children?: ReactNode;
}

/** Base screen: canvas background, safe top inset and an optional title (+ back button). */
export function Screen({ title, subtitle, padded = true, showBack = false, children }: ScreenProps) {
  const tokens = useTokens();
  const router = useRouter();
  const { t } = useTranslation('app');

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: tokens.color.bg.canvas }]}>
      <View style={[styles.body, !padded && styles.bodyFlush]}>
        {title ? (
          showBack ? (
            <View style={styles.titleRow}>
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel={t('back')}
                hitSlop={8}
                style={styles.back}>
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={26}
                  color={tokens.color.text.primary}
                />
              </Pressable>
              <Text style={[styles.title, styles.titleCentered, { color: tokens.color.text.primary }]}>
                {title}
              </Text>
              <View style={styles.back} />
            </View>
          ) : (
            <Text style={[styles.title, { color: tokens.color.text.primary }]}>{title}</Text>
          )
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
  body: { flex: 1, minHeight: 0, paddingHorizontal: 16, paddingTop: 24, gap: 8 },
  bodyFlush: { paddingHorizontal: 0, paddingTop: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  back: { width: 36, alignItems: 'flex-start' },
  title: { fontSize: 24, fontWeight: '800' },
  titleCentered: { flex: 1, textAlign: 'center', fontSize: 18 },
  subtitle: { fontSize: 15 },
});
