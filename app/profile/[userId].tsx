import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  const scrolled = useRef(false);

  // Scroll to the tapped post (respecting position so the user can keep browsing).
  useEffect(() => {
    if (scrolled.current || !params.postId || posts.items.length === 0) return;
    const index = posts.items.findIndex((item) => item.post.id === params.postId);
    if (index < 0) return;
    scrolled.current = true;
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, viewPosition: 0.3, animated: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [params.postId, posts.items]);

  return (
    <Screen padded={false}>
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
                <PostCard item={item} onOpenComments={() => setActivePost(item.post)} />
              )}
              keyExtractor={(item) => item.post.id}
              hasMore={posts.hasMore}
              loadingMore={posts.loadingMore}
              refreshing={posts.refreshing}
              onEndReached={posts.loadMore}
              onRefresh={posts.refresh}
              contentContainerStyle={styles.listContent}
              onScrollToIndexFailed={({ index, averageItemLength }) => {
                listRef.current?.scrollToOffset({
                  offset: index * averageItemLength,
                  animated: true,
                });
              }}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  column: { flex: 1, minHeight: 0 },
  list: { flex: 1, minHeight: 0 },
  listContent: { paddingTop: 12 },
  center: { marginTop: 24 },
  message: { textAlign: 'center', margin: 24 },
});
