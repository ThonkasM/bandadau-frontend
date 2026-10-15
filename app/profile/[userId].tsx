import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  type FlatList,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppHeader } from '@/components/screens/app-header';
import { Screen } from '@/components/screens/screen';
import { FeedList } from '@/components/ui/feed-list';
import CommentsPanel from '@/features/comments/comments-panel';
import { FeedRightRail } from '@/features/feed/components/feed-right-rail';
import { PostCard } from '@/features/feed/components/post-card';
import type { FeedItem, Post } from '@/features/feed/types';
import { useUserPosts } from '@/features/profile/api';
import { useTokens } from '@/theme/theme-provider';

const WEB_COLUMN_WIDTH = 480;
const RAIL_MIN_WIDTH = 1200;
const LIST_TOP_PADDING = 12;
const MAX_REALIGNS = 12;

/** Instagram-like user feed: posts of one user (opened from the profile grid). */
export default function UserPostsScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('profile');
  const params = useLocalSearchParams<{ userId: string; name?: string; postId?: string }>();
  const posts = useUserPosts(params.userId);
  const { width } = useWindowDimensions();
  const showRail = Platform.OS === 'web' && width >= RAIL_MIN_WIDTH;
  const [activePost, setActivePost] = useState<Post | null>(null);
  const listRef = useRef<FlatList<FeedItem>>(null);
  const heights = useRef<Record<string, number>>({});
  const targetIndex = useRef<number | null>(null);
  const realigns = useRef(0);

  // Exact offset from the measured card heights (works on web, where
  // `scrollToIndex` needs `getItemLayout` and otherwise lands off).
  const scrollToTarget = useCallback(() => {
    const index = targetIndex.current;
    if (index === null || index < 0 || !listRef.current) return;
    let offset = LIST_TOP_PADDING;
    for (let i = 0; i < index; i += 1) {
      const height = heights.current[posts.items[i]?.post.id ?? ''];
      if (height === undefined) {
        // Not measured yet → approximate; `onContentSizeChange` will realign.
        listRef.current.scrollToOffset({ offset: index * 320, animated: false });
        return;
      }
      offset += height;
    }
    listRef.current.scrollToOffset({ offset, animated: false });
  }, [posts.items]);

  // Jump straight to the tapped post (no animation). If it's the most recent
  // post (first item), just show the feed from the start.
  useEffect(() => {
    if (targetIndex.current !== null || !params.postId || posts.items.length === 0) return;
    const index = posts.items.findIndex((item) => item.post.id === params.postId);
    if (index <= 0) {
      targetIndex.current = -1;
      return;
    }
    targetIndex.current = index;
    const timer = setTimeout(scrollToTarget, 80);
    return () => clearTimeout(timer);
  }, [params.postId, posts.items, scrollToTarget]);

  // Images change the card heights as they load; realign until it stabilizes.
  const realign = useCallback(() => {
    if (targetIndex.current === null || targetIndex.current < 0) return;
    if (realigns.current >= MAX_REALIGNS) return;
    realigns.current += 1;
    scrollToTarget();
  }, [scrollToTarget]);

  return (
    <Screen padded={false}>
      <View style={styles.fill}>
        <AppHeader title={params.name ?? t('posts')} />

        <View style={styles.row}>
          <View style={[styles.column, showRail && { maxWidth: WEB_COLUMN_WIDTH }]}>
            {posts.loading ? (
              <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
            ) : (
              <FeedList<FeedItem>
                listRef={listRef}
                style={styles.list}
                data={posts.items}
                renderItem={({ item }) => (
                  <View
                    onLayout={(event) => {
                      heights.current[item.post.id] = event.nativeEvent.layout.height;
                    }}>
                    <PostCard item={item} onOpenComments={() => setActivePost(item.post)} />
                  </View>
                )}
                keyExtractor={(item) => item.post.id}
                hasMore={posts.hasMore}
                loadingMore={posts.loadingMore}
                refreshing={posts.refreshing}
                onEndReached={posts.loadMore}
                onRefresh={posts.refresh}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={realign}
                renderEmpty={() => (
                  <Text style={[styles.message, { color: tokens.color.text.muted }]}>
                    {t('postsEmpty')}
                  </Text>
                )}
              />
            )}
          </View>

          {showRail ? <FeedRightRail /> : null}
        </View>

        <CommentsPanel
          post={activePost}
          visible={Boolean(activePost)}
          onClose={() => setActivePost(null)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 0 },
  row: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 16,
  },
  column: { flex: 1, minHeight: 0 },
  list: { flex: 1, minHeight: 0 },
  listContent: { paddingTop: LIST_TOP_PADDING },
  center: { marginTop: 24 },
  message: { textAlign: 'center', margin: 24 },
});
