import { errorMessage, type Locale } from '@bandada/i18n';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { PaymentModal, type PaymentPhase } from '@/components/ui/payment-modal';
import { useEvent, useRegisterToEvent, useRegistration } from '@/features/events/api';
import EventDetailView from '@/features/events/components/event-detail-view';
import { useTicket } from '@/features/tickets/api';
import { TicketRevealModal } from '@/features/tickets/components/ticket-reveal-modal';
import { newUuid } from '@/lib/ids';
import { useTokens } from '@/theme/theme-provider';

/** UC-12 · Event detail + register: simulated payment SAGA → ticket reveal. */
export default function EventDetailScreen() {
  const tokens = useTokens();
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { t, i18n } = useTranslation('events');
  const { t: ta } = useTranslation('app');
  const locale = i18n.language as Locale;
  const event = useEvent(eventId);
  const register = useRegisterToEvent();
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const registration = useRegistration(registrationId);
  const reg = registration.data;
  const confirmed = reg?.status === 'CONFIRMED';
  const revealed = useTicket(reg?.ticketId ?? undefined);
  const [dismissed, setDismissed] = useState(false);
  const idempotencyKey = useRef(newUuid());

  if (event.isLoading) {
    return (
      <Screen title={t('title')} showBack>
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      </Screen>
    );
  }

  if (event.isError || !event.data) {
    return (
      <Screen title={t('title')} showBack>
        <Text style={{ color: tokens.color.text.muted }}>{ta('retry')}</Text>
      </Screen>
    );
  }

  const data = event.data;

  const revealVisible = !dismissed && confirmed && Boolean(revealed.data);
  const paymentVisible =
    !dismissed && !revealVisible && (register.isPending || register.isError || Boolean(registrationId));
  const phase: PaymentPhase = register.isError ? 'failed' : 'processing';

  const startRegister = () => {
    idempotencyKey.current = newUuid();
    setRegistrationId(null);
    setDismissed(false);
    register.mutate(
      { eventId: data.id, idempotencyKey: idempotencyKey.current },
      { onSuccess: (r) => setRegistrationId(r.id) },
    );
  };

  const saveTicket = () => {
    setDismissed(true);
    router.push('/tickets');
  };

  return (
    <Screen title={t('title')} showBack padded={false}>
      <EventDetailView
        event={data}
        confirmed={confirmed}
        onParticipate={startRegister}
        onViewTickets={() => router.push('/tickets')}
      />

      <PaymentModal
        visible={paymentVisible}
        phase={phase}
        onClose={() => setDismissed(true)}
        copy={{
          processing: {
            title: t('payment.processingTitle'),
            subtitle:
              data.priceCredits > 0 ? t('payment.debiting', { count: data.priceCredits }) : undefined,
            steps: [t('payment.step1'), t('payment.step2'), t('payment.step3')],
            note: t('payment.dontClose'),
          },
          confirmed: {
            title: t('payment.confirmedTitle'),
            subtitle: t('payment.confirmedSubtitle'),
            primaryLabel: t('payment.viewTicket'),
            onPrimary: saveTicket,
          },
          failed: {
            title: t('payment.failedTitle'),
            message: errorMessage(reg?.failureReason ?? undefined, locale),
            primaryLabel: t('payment.retry'),
            onPrimary: startRegister,
            secondaryLabel: t('payment.close'),
          },
        }}
      />

      {revealed.data ? (
        <TicketRevealModal visible={revealVisible} ticket={revealed.data} onSave={saveTicket} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { marginTop: 24 },
});
