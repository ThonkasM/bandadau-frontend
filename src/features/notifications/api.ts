import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type { NotificationPage } from './types';

/** UC-24: paginated in-app inbox (most recent first). */
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      apiRequest<NotificationPage>('/api/v1/notifications', {
        query: { cursor: pageParam, limit: 20 },
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiRequest<void>(`/api/v1/notifications/${id}/read`, { method: 'POST' }),
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
