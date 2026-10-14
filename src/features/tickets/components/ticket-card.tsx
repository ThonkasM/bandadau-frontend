import { formatDate, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
      <View style={[styles.qr, { borderColor: tokens.color.border.default }]}>
        <MaterialCommunityIcons name="qrcode" size={40} color={tokens.color.text.primary} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: tokens.color.text.primary }]} numberOfLines={1}>
          {ticket.eventTitle ?? t('ticket')}
        </Text>
        {ticket.eventStartsAt ? (
          <Text style={[styles.meta, { color: tokens.color.text.muted }]}>
            {formatDate(ticket.eventStartsAt, locale, 'long')}
          </Text>
        ) : null}
        {ticket.venue ? (
          <Text style={[styles.meta, { color: tokens.color.text.muted }]} numberOfLines={1}>
            {ticket.venue}
          </Text>
        ) : null}
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.fg }]}>
            {t(`status.${ticket.status}`)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  qr: {
    width: 76,
    height: 76,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 3, justifyContent: 'center' },
  title: { fontSize: 15.5, fontWeight: '800' },
  meta: { fontSize: 13 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  badgeText: { fontSize: 11.5, fontWeight: '700' },
});
