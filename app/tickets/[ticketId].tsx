import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { useTicket } from '@/features/tickets/api';
import { TicketPass } from '@/features/tickets/components/ticket-pass';
import { TicketQrModal } from '@/features/tickets/components/ticket-qr-modal';
import { useTokens } from '@/theme/theme-provider';

/** UC-12 · Ticket detail (Eventbrite-style) with a tap-to-enlarge QR. */
export default function TicketDetailScreen() {
  const tokens = useTokens();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const { t } = useTranslation('tickets');
  const ticket = useTicket(ticketId);
  const [qrOpen, setQrOpen] = useState(false);

  if (ticket.isLoading) {
    return (
      <Screen title={t('title')} showBack padded={false}>
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      </Screen>
    );
  }

  if (!ticket.data) {
    return (
      <Screen title={t('title')} showBack padded={false}>
        <Text style={[styles.center, { color: tokens.color.text.muted }]}>{t('error')}</Text>
      </Screen>
    );
  }

  return (
    <Screen title={t('title')} showBack padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TicketPass
          ticket={ticket.data}
          qr={ticket.data.qrPayload}
          interactive
          onPressQr={() => setQrOpen(true)}
        />
      </ScrollView>

      <TicketQrModal visible={qrOpen} ticket={ticket.data} onClose={() => setQrOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { marginTop: 24, textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 32 },
});
