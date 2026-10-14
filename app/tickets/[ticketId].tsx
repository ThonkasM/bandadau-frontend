import { formatDate, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { useTicket } from '@/features/tickets/api';
import { useTokens } from '@/theme/theme-provider';

/** UC-12 · Ticket detail with QR (always dark-on-light per D13). */
export default function TicketDetailScreen() {
  const tokens = useTokens();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation('tickets');
  const locale = i18n.language as Locale;
  const ticket = useTicket(id);

  return (
    <Screen title={t('title')}>
      {ticket.isLoading ? (
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      ) : ticket.data ? (
        <View
          style={[
            styles.card,
            { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
          ]}>
          <View style={styles.head}>
            <Text style={[styles.event, { color: tokens.color.text.primary }]}>
              {ticket.data.eventTitle ?? t('ticket')}
            </Text>
            {ticket.data.eventStartsAt ? (
              <Text style={{ color: tokens.color.text.muted }}>
                {formatDate(ticket.data.eventStartsAt, locale, 'long')}
              </Text>
            ) : null}
            {ticket.data.venue ? (
              <Text style={{ color: tokens.color.text.muted }}>{ticket.data.venue}</Text>
            ) : null}
          </View>

          <View style={[styles.divider, { borderTopColor: tokens.color.border.default }]} />

          <View style={styles.qrWrap}>
            <View
              style={[
                styles.qrCard,
                { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
              ]}>
              <MaterialCommunityIcons name="qrcode" size={196} color={tokens.color.text.primary} />
            </View>
          </View>

          <Text style={[styles.hint, { color: tokens.color.text.muted }]}>{t('qrHint')}</Text>
          <Text style={[styles.status, { color: tokens.color.text.link }]}>
            {t(`status.${ticket.data.status}`)}
          </Text>
        </View>
      ) : (
        <Text style={{ color: tokens.color.text.muted }}>{t('error')}</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { marginTop: 24 },
  card: { borderWidth: 1, borderRadius: 20, padding: 20, alignItems: 'center', gap: 8, marginTop: 8 },
  head: { alignItems: 'center', gap: 2 },
  event: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  divider: {
    width: '100%',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  qrWrap: { alignItems: 'center' },
  qrCard: { borderWidth: 1, borderRadius: 16, padding: 16 },
  hint: { textAlign: 'center', marginTop: 4 },
  status: { fontSize: 13, fontWeight: '700' },
});
