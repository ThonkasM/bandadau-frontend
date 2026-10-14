import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { FeedList } from '@/components/ui/feed-list';
import CommentsPanel from '@/features/comments/comments-panel';
import { PostCard } from '@/features/feed/components/post-card';
import type { FeedItem, Post } from '@/features/feed/types';
import { useUserPosts } from '@/features/profile/api';
import { useTokens } from '@/theme/theme-provider';

/** Instagram-like user feed: posts of one user (opened from the profile grid). */
export default function UserPostsScreen() {
  const tokens = useTokens();
  const router = useRouter();
  const { t } = useTranslation('profile');
  const params = useLocalSearchParams<{ userId: string; name?: string }>();
  const posts = useUserPosts(params.userId);
  const [activePost, setActivePost] = useState<Post | null>(null);

  return (
    <Screen padded={false}>
      <View style={[styles.header, { borderBottomColor: tokens.color.border.default }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          style={styles.back}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={tokens.color.text.primary} />
        </Pressable>
        <Text style={[styles.title, { color: tokens.color.text.primary }]} numberOfLines={1}>
          {params.name ?? t('posts')}
        </Text>
        <View style={styles.back} />
      </View>

      {posts.loading ? (
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      ) : (
        <FeedList<FeedItem>
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
          renderEmpty={() => (
            <Text style={[styles.message, { color: tokens.color.text.muted }]}>
              {t('postsEmpty')}
            </Text>
          )}
        />
      )}

      <CommentsPanel
        post={activePost}
        visible={Boolean(activePost)}
        onClose={() => setActivePost(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { width: 40, alignItems: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  list: { flex: 1 },
  listContent: { paddingTop: 12 },
  center: { marginTop: 24 },
  message: { textAlign: 'center', margin: 24 },
});
