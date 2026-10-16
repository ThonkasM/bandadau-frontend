import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTokens } from '@/theme/theme-provider';

/** Shared title bar for the profile menu and its settings sub-view. */
export function MenuHeader({
  title,
  onBack,
  onClose,
}: {
  title: string;
  onBack?: () => void;
  onClose: () => void;
}) {
  const tokens = useTokens();
  const { t } = useTranslation('app');

  return (
    <View style={[styles.header, { borderBottomColor: tokens.color.border.default }]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          hitSlop={8}
          style={[styles.iconButton, { backgroundColor: tokens.color.bg.muted }]}>
          <MaterialCommunityIcons name="chevron-left" size={18} color={tokens.color.text.secondary} />
        </Pressable>
      ) : null}
      <Text numberOfLines={1} style={[styles.title, { color: tokens.color.text.primary }]}>
        {title}
      </Text>
      <View style={styles.spacer} />
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('close')}
        hitSlop={8}
        style={[styles.iconButton, { backgroundColor: tokens.color.bg.muted }]}>
        <MaterialCommunityIcons name="close" size={18} color={tokens.color.text.secondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
    paddingTop: 2,
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: '800' },
  spacer: { flex: 1 },
  iconButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
