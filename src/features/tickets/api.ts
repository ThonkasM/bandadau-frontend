import { useMutation, useQuery } from '@tanstack/react-query';

import { useInfiniteList } from '@/hooks/use-infinite-list';
import { apiRequest } from '@/lib/api-client';
import type { ApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';

import type { Ticket, TicketDetail, TicketPage, TicketSort, ValidateTicketResponse } from './types';

/** UC-12/14: my tickets (QR). `sort` is resolved by the service (GSI1/GSI3). */
export function useMyTickets(sort: TicketSort = 'eventDate') {
  return useInfiniteList<Ticket>({
    queryKey: queryKeys.tickets.mine(sort),
    fetchPage: (cursor) =>
      apiRequest<TicketPage>('/api/v1/tickets/me', { query: { cursor, limit: 20, sort } }),
    getId: (item) => item.id,
  });
}

export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tickets.byId(id ?? ''),
    queryFn: () => apiRequest<TicketDetail>(`/api/v1/tickets/${id}`),
    enabled: Boolean(id),
  });
}

/** UC-14: validate a scanned ticket at the door (♻️, ORGANIZER). */
export function useValidateTicket() {
  return useMutation<ValidateTicketResponse, ApiError, { qrPayload: string; eventId?: string }>({
    mutationFn: (input) =>
      apiRequest<ValidateTicketResponse>('/api/v1/tickets/validate', {
        method: 'POST',
        body: input,
        idempotent: true,
      }),
  });
}
