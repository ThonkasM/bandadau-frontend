import { formatDate, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Ticket } from '@/features/tickets/types';
import { useTokens } from '@/theme/theme-provider';

export function TicketCard({ ticket, onPress }: { ticket: Ticket; onPress?: () => void }) {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('tickets');
  const locale = i18n.language as Locale;

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
        <Text style={[styles.title, { color: tokens.color.text.primary }]}>
          {ticket.eventTitle ?? t('ticket')}
        </Text>
        {ticket.eventStartsAt ? (
          <Text style={[styles.meta, { color: tokens.color.text.muted }]}>
            {formatDate(ticket.eventStartsAt, locale, 'long')}
          </Text>
        ) : null}
        <Text style={[styles.status, { color: tokens.color.text.link }]}>
          {t(`status.${ticket.status}`)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12 },
  qr: { width: 72, height: 72, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 4, justifyContent: 'center' },
  title: { fontSize: 15.5, fontWeight: '800' },
  meta: { fontSize: 13 },
  status: { fontSize: 13, fontWeight: '700' },
});
