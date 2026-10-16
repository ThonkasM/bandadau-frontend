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
 * Secondary-screen header: circular back button, bold left title and an optional
 * right action. Shared by every non-main screen (directly or via `Screen showBack`).
 */
export function AppHeader({ title, onBack, right, style }: AppHeaderProps) {
  const tokens = useTokens();
  const { t } = useTranslation('app');
  const goBack = useGoBack();
  const handleBack = onBack ?? goBack;

  return (
    <View style={[styles.header, style]}>
      <Pressable
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel={t('back')}
        hitSlop={8}
        style={({ pressed }) => [
          styles.back,
          { backgroundColor: tokens.color.bg.muted },
          pressed && styles.pressed,
        ]}>
        <MaterialCommunityIcons name="chevron-left" size={22} color={tokens.color.text.primary} />
      </Pressable>
      <Text numberOfLines={1} style={[styles.title, { color: tokens.color.text.primary }]}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  title: { flex: 1, fontSize: 18, fontWeight: '800' },
  right: { minWidth: 40, alignItems: 'flex-end' },
});
