import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { FeedList } from '@/components/ui/feed-list';
import { useMyTickets } from '@/features/tickets/api';
import { TicketCard } from '@/features/tickets/components/ticket-card';
import type { Ticket } from '@/features/tickets/types';
import { useTokens } from '@/theme/theme-provider';

/** UC-12 · My tickets. */
export default function TicketsScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('tickets');
  const { t: ta } = useTranslation('app');
  const router = useRouter();
  const list = useMyTickets();

  return (
    <Screen title={t('title')}>
      {list.loading ? (
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      ) : list.error ? (
        <>
          <Text style={[styles.message, { color: tokens.color.text.muted }]}>{t('error')}</Text>
          <Pressable
            onPress={list.refetch}
            style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
            <Text style={{ color: tokens.color.action.primary.fg }}>{ta('retry')}</Text>
          </Pressable>
        </>
      ) : (
        <FeedList<Ticket>
          style={styles.list}
          data={list.items}
          renderItem={({ item }) => (
            <TicketCard ticket={item} onPress={() => router.push(`/tickets/${item.id}`)} />
          )}
          keyExtractor={(item) => item.id}
          hasMore={list.hasMore}
          loadingMore={list.loadingMore}
          refreshing={list.refreshing}
          onEndReached={list.loadMore}
          onRefresh={list.refresh}
          renderEmpty={() => (
            <Text style={[styles.message, { color: tokens.color.text.muted }]}>{t('empty')}</Text>
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
