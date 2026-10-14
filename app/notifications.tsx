import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { VirtualList } from '@/components/ui/virtual-list';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/api';
import { NotificationItem } from '@/features/notifications/components/notification-item';
import type { AppNotification } from '@/features/notifications/types';
import { useTokens } from '@/theme/theme-provider';

export default function NotificationsScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('nav');
  const { t: tn } = useTranslation('notifications');
  const { t: ta } = useTranslation('app');
  const list = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = useMemo(
    () => list.data?.pages.flatMap((page) => page.items) ?? [],
    [list.data],
  );
  const hasUnread = items.some((item) => !item.readAt);

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => (
      <NotificationItem item={item} onPress={() => markRead.mutate(item.id)} />
    ),
    [markRead],
  );
  const keyExtractor = useCallback((item: AppNotification) => item.id, []);

  if (list.isLoading) {
    return (
      <Screen title={t('notifications')}>
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      </Screen>
    );
  }

  if (list.isError) {
    return (
      <Screen title={t('notifications')}>
        <Text style={[styles.message, { color: tokens.color.text.muted }]}>{tn('error')}</Text>
        <Pressable
          onPress={() => list.refetch()}
          style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
          <Text style={{ color: tokens.color.action.primary.fg }}>{ta('retry')}</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen title={t('notifications')}>
      {hasUnread && (
        <Pressable onPress={() => markAll.mutate()}>
          <Text style={{ color: tokens.color.text.link }}>{tn('markAll')}</Text>
        </Pressable>
      )}
      <VirtualList
        style={styles.list}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={[styles.message, { color: tokens.color.text.muted }]}>{tn('empty')}</Text>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, marginTop: 8 },
  listContent: { paddingBottom: 96 },
  center: { marginTop: 24 },
  message: { fontSize: 15, marginTop: 16 },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
});
