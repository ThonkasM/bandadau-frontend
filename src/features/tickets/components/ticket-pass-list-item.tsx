import type { StyleProp, ViewStyle } from 'react-native';

import { useTicket } from '@/features/tickets/api';
import { TicketPass } from '@/features/tickets/components/ticket-pass';
import type { Ticket } from '@/features/tickets/types';

/**
 * List item: fetches the ticket detail (`GET /tickets/{id}` → `qrPayload`) so the
 * pass shows its real QR. The query is cached, so opening the modal is instant.
 */
export function TicketPassListItem({
  ticket,
  onPress,
  style,
}: {
  ticket: Ticket;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const detail = useTicket(ticket.id);
  return <TicketPass ticket={ticket} qr={detail.data?.qrPayload} onPress={onPress} style={style} />;
}
