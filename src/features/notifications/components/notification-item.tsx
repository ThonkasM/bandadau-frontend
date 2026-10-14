import { formatRelative, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppNotification, NotificationType } from '@/features/notifications/types';
import { useTokens } from '@/theme/theme-provider';

const ICONS: Partial<Record<NotificationType, keyof typeof MaterialCommunityIcons.glyphMap>> = {
  REGISTRATION_CONFIRMED: 'ticket-confirmation-outline',
  REGISTRATION_FAILED: 'ticket-confirmation-outline',
  REGISTRATION_CANCELLED: 'ticket-confirmation-outline',
  EVENT_REMINDER: 'calendar-clock',
  EVENT_CANCELLED: 'calendar-remove',
  NEW_COMMENT: 'comment-outline',
  NEW_REACTION: 'heart-outline',
  NEW_FOLLOWER: 'account-plus-outline',
  GROUP_REQUEST: 'account-group-outline',
  TOPUP_PAID: 'wallet-outline',
  CONTENT_FLAGGED: 'flag-outline',
  ALERT: 'alert-outline',
  WELCOME: 'hand-wave-outline',
  NEW_EVENT: 'calendar-star',
};

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
  const icon = ICONS[item.type] ?? 'bell-outline';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.card,
        { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
      ]}>
      <View
        style={[
          styles.icon,
          { backgroundColor: unread ? tokens.color.bg.muted : tokens.color.bg.canvas },
        ]}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={unread ? tokens.color.action.primary.bg : tokens.color.text.muted}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: tokens.color.text.primary }]}>{item.title}</Text>
        <Text style={[styles.body, { color: tokens.color.text.secondary }]}>{item.body}</Text>
        <Text style={[styles.time, { color: tokens.color.text.muted }]}>
          {formatRelative(item.createdAt, locale)}
        </Text>
      </View>
      {unread ? (
        <View style={[styles.dot, { backgroundColor: tokens.color.action.primary.bg }]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, gap: 2 },
  title: { fontSize: 14.5, fontWeight: '700' },
  body: { fontSize: 13.5, lineHeight: 19 },
  time: { fontSize: 11.5, marginTop: 2 },
  dot: { width: 9, height: 9, borderRadius: 5 },
});
