import { useQuery } from '@tanstack/react-query';

import { useInfiniteList } from '@/hooks/use-infinite-list';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type { Ticket, TicketPage } from './types';

/** UC-12/14: my tickets (QR). */
export function useMyTickets() {
  return useInfiniteList<Ticket>({
    queryKey: queryKeys.tickets.mine(),
    fetchPage: (cursor) =>
      apiRequest<TicketPage>('/api/v1/tickets/me', { query: { cursor, limit: 20 } }),
    getId: (item) => item.id,
  });
}

export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tickets.byId(id ?? ''),
    queryFn: () => apiRequest<Ticket>(`/api/v1/tickets/${id}`),
    enabled: Boolean(id),
  });
}
