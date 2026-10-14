import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { FeedList } from '@/components/ui/feed-list';
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

  const hasUnread = list.items.some((item) => !item.readAt);

  return (
    <Screen title={t('notifications')}>
      {list.loading ? (
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      ) : list.error ? (
        <>
          <Text style={[styles.message, { color: tokens.color.text.muted }]}>{tn('error')}</Text>
          <Pressable
            onPress={list.refetch}
            style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
            <Text style={{ color: tokens.color.action.primary.fg }}>{ta('retry')}</Text>
          </Pressable>
        </>
      ) : (
        <>
          {hasUnread ? (
            <Pressable onPress={() => markAll.mutate()} style={styles.markAll}>
              <Text style={{ color: tokens.color.text.link }}>{tn('markAll')}</Text>
            </Pressable>
          ) : null}
          <FeedList<AppNotification>
            style={styles.list}
            data={list.items}
            renderItem={({ item }) => (
              <NotificationItem item={item} onPress={() => markRead.mutate(item.id)} />
            )}
            keyExtractor={(item) => item.id}
            hasMore={list.hasMore}
            loadingMore={list.loadingMore}
            refreshing={list.refreshing}
            onEndReached={list.loadMore}
            onRefresh={list.refresh}
            renderEmpty={() => (
              <Text style={[styles.message, { color: tokens.color.text.muted }]}>
                {tn('empty')}
              </Text>
            )}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  markAll: { paddingVertical: 8 },
  center: { marginTop: 24 },
  message: { fontSize: 15, marginTop: 16 },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
});
