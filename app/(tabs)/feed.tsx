import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { VirtualList } from '@/components/ui/virtual-list';
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

  const items = useMemo(
    () => feed.data?.pages.flatMap((page) => page.items) ?? [],
    [feed.data],
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => <PostCard item={item} />,
    [],
  );
  const keyExtractor = useCallback((item: FeedItem) => item.post.id, []);

  const onEndReached = useCallback(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
  }, [feed]);

  if (feed.isLoading) {
    return (
      <Screen title={t('feed')}>
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      </Screen>
    );
  }

  if (feed.isError) {
    return (
      <Screen title={t('feed')}>
        <Text style={[styles.message, { color: tokens.color.text.muted }]}>{tf('error')}</Text>
        <Pressable
          onPress={() => feed.refetch()}
          style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
          <Text style={{ color: tokens.color.action.primary.fg }}>{ta('retry')}</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen title={t('feed')}>
      <VirtualList
        style={styles.list}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={[styles.message, { color: tokens.color.text.muted }]}>{tf('empty')}</Text>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: 96 },
  center: { marginTop: 24 },
  message: { fontSize: 15, marginTop: 16 },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
});
