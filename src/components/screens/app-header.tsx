import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useGoBack } from '@/hooks/use-go-back';
import { useTokens } from '@/theme/theme-provider';

export interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Secondary-screen header: back button on the left, centered title, optional
 * right action. Rule: any screen that is not a main tab uses a header with a
 * back button.
 */
export function AppHeader({ title, onBack, right, style }: AppHeaderProps) {
  const tokens = useTokens();
  const { t } = useTranslation('app');
  const goBack = useGoBack();
  const handleBack = onBack ?? goBack;

  return (
    <View style={[styles.header, { borderBottomColor: tokens.color.border.default }, style]}>
      <Pressable
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel={t('back')}
        hitSlop={8}
        style={styles.side}>
        <MaterialCommunityIcons name="chevron-left" size={26} color={tokens.color.text.primary} />
      </Pressable>
      <Text style={[styles.title, { color: tokens.color.text.primary }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: { width: 44, alignItems: 'flex-start' },
  sideRight: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },
});
