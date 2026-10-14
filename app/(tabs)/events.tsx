import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { FeedList } from '@/components/ui/feed-list';
import { useEvents } from '@/features/events/api';
import { EventCard } from '@/features/events/components/event-card';
import type { Event } from '@/features/events/types';
import { useTokens } from '@/theme/theme-provider';

export default function EventsScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('nav');
  const { t: te } = useTranslation('events');
  const { t: ta } = useTranslation('app');
  const router = useRouter();
  const list = useEvents();

  return (
    <Screen title={t('events')}>
      {list.loading ? (
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      ) : list.error ? (
        <>
          <Text style={[styles.message, { color: tokens.color.text.muted }]}>{te('error')}</Text>
          <Pressable
            onPress={list.refetch}
            style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
            <Text style={{ color: tokens.color.action.primary.fg }}>{ta('retry')}</Text>
          </Pressable>
        </>
      ) : (
        <FeedList<Event>
          style={styles.list}
          data={list.items}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => router.push(`/events/${item.id}`)} />
          )}
          keyExtractor={(item) => item.id}
          hasMore={list.hasMore}
          loadingMore={list.loadingMore}
          refreshing={list.refreshing}
          onEndReached={list.loadMore}
          onRefresh={list.refresh}
          renderEmpty={() => (
            <Text style={[styles.message, { color: tokens.color.text.muted }]}>{te('empty')}</Text>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, marginTop: 8 },
  center: { marginTop: 24 },
  message: { fontSize: 15, marginTop: 16 },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
});
