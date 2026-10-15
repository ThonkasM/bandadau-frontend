import { formatDate, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Ticket, TicketStatus } from '@/features/tickets/types';
import { useTokens } from '@/theme/theme-provider';

function useStatusColors(status: TicketStatus) {
  const tokens = useTokens();
  if (status === 'ISSUED') {
    return { bg: tokens.color.feedback.success.bg, fg: tokens.color.feedback.success.fg };
  }
  if (status === 'VOIDED') {
    return { bg: tokens.color.feedback.danger.bg, fg: tokens.color.feedback.danger.fg };
  }
  return { bg: tokens.color.bg.muted, fg: tokens.color.text.muted };
}

export function TicketCard({ ticket, onPress }: { ticket: Ticket; onPress?: () => void }) {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('tickets');
  const locale = i18n.language as Locale;
  const status = useStatusColors(ticket.status);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.card,
        { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
      ]}>
      <Image
        source={{ uri: `https://picsum.photos/seed/bandada-event-${ticket.eventId}/400/400` }}
        style={styles.thumb}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.body}>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.fg }]}>{t(`status.${ticket.status}`)}</Text>
        </View>
        <Text style={[styles.title, { color: tokens.color.text.primary }]} numberOfLines={2}>
          {ticket.eventTitle ?? t('ticket')}
        </Text>
        {ticket.eventStartsAt ? (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={14}
              color={tokens.color.text.muted}
            />
            <Text style={[styles.meta, { color: tokens.color.text.muted }]} numberOfLines={1}>
              {formatDate(ticket.eventStartsAt, locale, 'long')}
            </Text>
          </View>
        ) : null}
        {ticket.venue ? (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color={tokens.color.text.muted}
            />
            <Text style={[styles.meta, { color: tokens.color.text.muted }]} numberOfLines={1}>
              {ticket.venue}
            </Text>
          </View>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={tokens.color.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  body: { flex: 1, gap: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 15.5, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12.5, flex: 1 },
});
