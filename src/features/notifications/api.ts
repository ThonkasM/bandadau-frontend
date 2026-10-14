import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useInfiniteList } from '@/hooks/use-infinite-list';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type { AppNotification, NotificationPage } from './types';

/** UC-24: paginated in-app inbox (most recent first). */
export function useNotifications() {
  return useInfiniteList<AppNotification>({
    queryKey: queryKeys.notifications.list(),
    fetchPage: (cursor) =>
      apiRequest<NotificationPage>('/api/v1/notifications', { query: { cursor, limit: 20 } }),
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
