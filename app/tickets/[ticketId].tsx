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
        <View style={styles.content}>
          <Text style={[styles.event, { color: tokens.color.text.primary }]}>
            {ticket.data.eventTitle ?? t('ticket')}
          </Text>
          {ticket.data.eventStartsAt ? (
            <Text style={{ color: tokens.color.text.muted }}>
              {formatDate(ticket.data.eventStartsAt, locale, 'long')}
            </Text>
          ) : null}
          <View style={[styles.qrCard, { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default }]}>
            <MaterialCommunityIcons name="qrcode" size={180} color={tokens.color.text.primary} />
          </View>
          <Text style={{ color: tokens.color.text.muted }}>{t('qrHint')}</Text>
          <Text style={{ color: tokens.color.text.link }}>{t(`status.${ticket.data.status}`)}</Text>
        </View>
      ) : (
        <Text style={{ color: tokens.color.text.muted }}>{t('error')}</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', gap: 10, marginTop: 12 },
  event: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  qrCard: { borderWidth: 1, borderRadius: 20, padding: 20, marginTop: 8 },
  center: { marginTop: 24 },
});
