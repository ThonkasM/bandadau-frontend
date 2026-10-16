import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useInfiniteList } from '@/hooks/use-infinite-list';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type { AppNotification, DevicePlatform, NotificationPage, NotificationPreferences } from './types';

/** UC-24: paginated in-app inbox (most recent first). */
export function useNotifications() {
  return useInfiniteList<AppNotification>({
    queryKey: queryKeys.notifications.list(),
    fetchPage: (cursor, signal) =>
      apiRequest<NotificationPage>('/api/v1/notifications', { query: { cursor, limit: 20 }, signal }),
    getId: (item) => item.id,
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiRequest<void>(`/api/v1/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications.root() }),
  });
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => apiRequest<void>('/api/v1/notifications/read-all', { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications.root() }),
  });
}

/** UC-24: register a push device token. */
export function useRegisterDevice() {
  return useMutation<
    void,
    Error,
    { token: string; platform: DevicePlatform; appVersion?: string; deviceName?: string }
  >({
    mutationFn: ({ token, ...body }) =>
      apiRequest<void>(`/api/v1/devices/${token}`, { method: 'POST', body }),
  });
}

/** UC-24: unregister a push device token (logout). */
export function useUnregisterDevice() {
  return useMutation<void, Error, string>({
    mutationFn: (token) => apiRequest<void>(`/api/v1/devices/${token}`, { method: 'DELETE' }),
  });
}

/** UC-24: notification preferences. */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: [...queryKeys.notifications.root(), 'preferences'] as const,
    queryFn: () => apiRequest<NotificationPreferences>('/api/v1/notifications/preferences'),
  });
}

export function useUpdateNotificationPreferences() {
  const client = useQueryClient();
  return useMutation<NotificationPreferences, Error, Partial<NotificationPreferences>>({
    mutationFn: (input) =>
      apiRequest<NotificationPreferences>('/api/v1/notifications/preferences', {
        method: 'PUT',
        body: input,
      }),
    onSuccess: (prefs) =>
      client.setQueryData([...queryKeys.notifications.root(), 'preferences'], prefs),
  });
}
