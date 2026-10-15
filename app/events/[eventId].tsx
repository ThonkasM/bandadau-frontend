import { errorMessage, type Locale } from '@bandada/i18n';
import { useQueryClient } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { PaymentModal, type PaymentPhase } from '@/components/ui/payment-modal';
import {
  useEvent,
  useMyRegistrations,
  useRegisterToEvent,
  useRegistration,
} from '@/features/events/api';
import EventDetailView from '@/features/events/components/event-detail-view';
import { useTicket } from '@/features/tickets/api';
import { TicketRevealModal } from '@/features/tickets/components/ticket-reveal-modal';
import { newUuid } from '@/lib/ids';
import { queryKeys } from '@/lib/query-keys';
import { useSessionStore } from '@/stores/session.store';
import { useTokens } from '@/theme/theme-provider';

/** UC-12 · Event detail + register: simulated payment SAGA → ticket reveal. */
export default function EventDetailScreen() {
  const tokens = useTokens();
  const router = useRouter();
  const sessionStatus = useSessionStore((s) => s.status);
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { t, i18n } = useTranslation('events');
  const { t: ta } = useTranslation('app');
  const locale = i18n.language as Locale;
  const event = useEvent(eventId);
  const register = useRegisterToEvent();
  const client = useQueryClient();
  const myRegistrations = useMyRegistrations();
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const registration = useRegistration(registrationId);
  const reg = registration.data;
  const confirmed = reg?.status === 'CONFIRMED';
  const revealed = useTicket(reg?.ticketId ?? undefined);
  const [dismissed, setDismissed] = useState(false);
  const idempotencyKey = useRef(newUuid());

  // Route guard: anonymous users go to welcome (the detail lives in the root stack).
  if (sessionStatus === 'anonymous') return <Redirect href="/(auth)/welcome" />;

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
        <Text style={{ color: tokens.color.text.muted }}>{ta('errorMessage')}</Text>
        <Button label={ta('retry')} onPress={() => event.refetch()} />
      </Screen>
    );
  }

  const data = event.data;

  // Already has a live registration for this event → no re-purchase.
  const alreadyRegistered = myRegistrations.items.some(
    (r) => r.eventId === data.id && r.status !== 'FAILED' && r.status !== 'CANCELLED',
  );
  const registered = confirmed || alreadyRegistered;

  const revealVisible = !dismissed && confirmed && Boolean(revealed.data);
  const paymentVisible =
    !dismissed && !revealVisible && (register.isPending || register.isError || Boolean(registrationId));
  const phase: PaymentPhase = register.isError ? 'failed' : 'processing';

  // `fresh` = new intent (regenerate the key); a retry reuses the same key.
  const startRegister = (fresh = false) => {
    if (fresh) idempotencyKey.current = newUuid();
    setRegistrationId(null);
    setDismissed(false);
    register.mutate(
      { eventId: data.id, idempotencyKey: idempotencyKey.current },
      { onSuccess: (r) => setRegistrationId(r.id) },
    );
  };

  const saveTicket = () => {
    setDismissed(true);
    // Refresh the lists so the new ticket/registration shows up immediately.
    void client.invalidateQueries({ queryKey: queryKeys.tickets.root() });
    void client.invalidateQueries({ queryKey: queryKeys.registrations.root() });
    router.push('/tickets');
  };

  return (
    <Screen title={t('title')} showBack padded={false}>
      <EventDetailView
        event={data}
        registered={registered}
        onParticipate={() => startRegister(true)}
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
            onPrimary: () => startRegister(),
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
