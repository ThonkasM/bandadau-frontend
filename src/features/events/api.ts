import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useInfiniteList } from '@/hooks/use-infinite-list';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type { Event, EventPage, Registration } from './types';

/** UC-11/12: public events list (cursor paginated). */
export function useEvents() {
  return useInfiniteList<Event>({
    queryKey: queryKeys.events.list(),
    fetchPage: (cursor) =>
      apiRequest<EventPage>('/api/v1/events', { query: { cursor, limit: 20 } }),
    getId: (item) => item.id,
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.byId(id ?? ''),
    queryFn: () => apiRequest<Event>(`/api/v1/events/${id}`),
    enabled: Boolean(id),
  });
}

/** UC-12: register to an event (♻️, SAGA server-side). */
export function useRegisterToEvent() {
  const client = useQueryClient();
  return useMutation<Registration, Error, { eventId: string; idempotencyKey: string }>({
    mutationFn: ({ eventId, idempotencyKey }) =>
      apiRequest<Registration>(`/api/v1/events/${eventId}/registrations`, {
        method: 'POST',
        idempotencyKey,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.events.root() }),
  });
}
