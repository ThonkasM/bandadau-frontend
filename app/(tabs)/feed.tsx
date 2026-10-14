import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { FeedList } from '@/components/ui/feed-list';
import { useFeed } from '@/features/feed/api';
import { PostCard } from '@/features/feed/components/post-card';
import type { FeedItem } from '@/features/feed/types';
import { useTokens } from '@/theme/theme-provider';

export default function FeedScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('nav');
  const { t: tf } = useTranslation('feed');
  const { t: ta } = useTranslation('app');
  const feed = useFeed();

  return (
    <Screen title={t('feed')}>
      {feed.loading ? (
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      ) : feed.error ? (
        <>
          <Text style={[styles.message, { color: tokens.color.text.muted }]}>{tf('error')}</Text>
          <Pressable
            onPress={feed.refetch}
            style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
            <Text style={{ color: tokens.color.action.primary.fg }}>{ta('retry')}</Text>
          </Pressable>
        </>
      ) : (
        <FeedList<FeedItem>
          style={styles.list}
          data={feed.items}
          renderItem={({ item }) => <PostCard item={item} />}
          keyExtractor={(item) => item.post.id}
          hasMore={feed.hasMore}
          loadingMore={feed.loadingMore}
          refreshing={feed.refreshing}
          onEndReached={feed.loadMore}
          onRefresh={feed.refresh}
          renderEmpty={() => (
            <Text style={[styles.message, { color: tokens.color.text.muted }]}>{tf('empty')}</Text>
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
