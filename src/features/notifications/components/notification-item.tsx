import { formatRelative, type Locale } from '@bandada/i18n';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppNotification } from '@/features/notifications/types';
import { useTokens } from '@/theme/theme-provider';

export function NotificationItem({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) {
  const tokens = useTokens();
  const { i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const unread = !item.readAt;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.card,
        { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
      ]}>
      <View style={styles.row}>
        {unread ? (
          <View style={[styles.dot, { backgroundColor: tokens.color.action.primary.bg }]} />
        ) : (
          <View style={styles.dot} />
        )}
        <View style={styles.content}>
          <Text style={[styles.title, { color: tokens.color.text.primary }]}>{item.title}</Text>
          <Text style={[styles.body, { color: tokens.color.text.secondary }]}>{item.body}</Text>
          <Text style={[styles.time, { color: tokens.color.text.muted }]}>
            {formatRelative(item.createdAt, locale)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  content: { flex: 1, gap: 2 },
  title: { fontSize: 14.5, fontWeight: '700' },
  body: { fontSize: 13.5, lineHeight: 19 },
  time: { fontSize: 11.5, marginTop: 2 },
});
