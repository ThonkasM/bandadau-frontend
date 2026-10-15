import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Screen } from '@/components/screens/screen';
import { FeedList } from '@/components/ui/feed-list';
import { useEvents } from '@/features/events/api';
import { EventCard } from '@/features/events/components/event-card';
import type { Event } from '@/features/events/types';
import { useTokens } from '@/theme/theme-provider';

const WEB_MAX_WIDTH = 960;
const GRID_MIN_WIDTH = 900;

export default function EventsScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('nav');
  const { t: te } = useTranslation('events');
  const { t: ta } = useTranslation('app');
  const router = useRouter();
  const list = useEvents();
  const { width } = useWindowDimensions();
  const numColumns = Platform.OS === 'web' && width >= GRID_MIN_WIDTH ? 2 : 1;

  return (
    <Screen padded={false}>
      <View style={styles.fill}>
        <View style={[styles.header, { borderBottomColor: tokens.color.border.default }]}>
          <Text style={[styles.headerTitle, { color: tokens.color.text.primary }]}>
            {t('events')}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.column, Platform.OS === 'web' && { maxWidth: WEB_MAX_WIDTH }]}>
            {list.loading ? (
              <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
            ) : list.error ? (
              <View style={styles.state}>
                <Text style={[styles.message, { color: tokens.color.text.muted }]}>{te('error')}</Text>
                <Pressable
                  onPress={list.refetch}
                  style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
                  <Text style={{ color: tokens.color.action.primary.fg }}>{ta('retry')}</Text>
                </Pressable>
              </View>
            ) : (
              <FeedList<Event>
                key={numColumns}
                numColumns={numColumns}
                style={styles.list}
                data={list.items}
                renderItem={({ item }) => (
                  <View style={numColumns > 1 ? styles.cell : undefined}>
                    <EventCard event={item} onPress={() => router.push(`/events/${item.id}`)} />
                  </View>
                )}
                keyExtractor={(item) => item.id}
                hasMore={list.hasMore}
                loadingMore={list.loadingMore}
                refreshing={list.refreshing}
                onEndReached={list.loadMore}
                onRefresh={list.refresh}
                contentContainerStyle={styles.listContent}
                renderEmpty={() => (
                  <Text style={[styles.message, { color: tokens.color.text.muted }]}>
                    {te('empty')}
                  </Text>
                )}
              />
            )}
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 0 },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  row: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  column: { flex: 1, minHeight: 0 },
  list: { flex: 1, minHeight: 0 },
  listContent: { paddingBottom: 96 },
  cell: { flex: 1 },
  center: { marginTop: 24 },
  state: { alignItems: 'center', paddingHorizontal: 16 },
  message: { fontSize: 15, marginTop: 16, textAlign: 'center' },
  button: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 12 },
});
