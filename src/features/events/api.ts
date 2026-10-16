import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { useInfiniteList } from '@/hooks/use-infinite-list';
import { apiRequest, apiRequestMeta } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type { CreateEventRequest, Event, EventPage, Registration, RegistrationPage } from './types';

// SAGA polling bounds (contract suggests `Retry-After`).
const MIN_POLL_MS = 1000;
const MAX_POLL_MS = 5000;
const POLL_CAP_MS = 120_000;

/** UC-11/12: public events list (cursor paginated). */
export function useEvents() {
  return useInfiniteList<Event>({
    queryKey: queryKeys.events.list(),
    fetchPage: (cursor, signal) =>
      apiRequest<EventPage>('/api/v1/events', { query: { cursor, limit: 20 }, signal }),
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

/**
 * UC-12/13: poll a registration while the SAGA is in progress, honouring the
 * `Retry-After` header (clamped to 1–5 s) with a total cap.
 */
export function useRegistration(id: string | null | undefined) {
  const retryRef = useRef(MIN_POLL_MS);
  const startRef = useRef<number | null>(null);
  return useQuery({
    queryKey: queryKeys.registrations.byId(id ?? ''),
    queryFn: async () => {
      const { data, retryAfter } = await apiRequestMeta<Registration>(
        `/api/v1/registrations/${id}`,
      );
      retryRef.current = Math.min(MAX_POLL_MS, Math.max(MIN_POLL_MS, (retryAfter ?? 1) * 1000));
      return data;
    },
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status !== 'PENDING' && status !== 'CANCELLATION_PENDING') {
        startRef.current = null;
        return false;
      }
      if (startRef.current === null) startRef.current = Date.now();
      if (Date.now() - startRef.current > POLL_CAP_MS) return false;
      return retryRef.current;
    },
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
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.events.root() });
      void client.invalidateQueries({ queryKey: queryKeys.registrations.root() });
    },
  });
}

/** UC-13: cancel a registration (inverse SAGA, 202 + Retry-After). */
export function useCancelRegistration() {
  const client = useQueryClient();
  return useMutation<Registration, Error, string>({
    mutationFn: (registrationId) =>
      apiRequest<Registration>(`/api/v1/registrations/${registrationId}/cancel`, {
        method: 'POST',
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.registrations.root() }),
  });
}

/** UC-12: my registrations. */
export function useMyRegistrations() {
  return useInfiniteList<Registration>({
    queryKey: queryKeys.registrations.mine(),
    fetchPage: (cursor, signal) =>
      apiRequest<RegistrationPage>('/api/v1/registrations/me', { query: { cursor, limit: 20 }, signal }),
    getId: (item) => item.id,
  });
}

/** UC-11: create an event (DRAFT, ORGANIZER). */
export function useCreateEvent() {
  const client = useQueryClient();
  return useMutation<Event, Error, CreateEventRequest>({
    mutationFn: (input) =>
      apiRequest<Event>('/api/v1/events', { method: 'POST', body: input, idempotent: true }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.events.root() }),
  });
}

/** UC-11: publish a draft event. */
export function usePublishEvent() {
  const client = useQueryClient();
  return useMutation<Event, Error, string>({
    mutationFn: (eventId) =>
      apiRequest<Event>(`/api/v1/events/${eventId}/publish`, { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.events.root() }),
  });
}
