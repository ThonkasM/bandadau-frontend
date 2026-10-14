import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import { BandadaMark, BandadaWordmark } from '@/components/brand/BandadaLogo';
import { Screen } from '@/components/screens/screen';
import { FeedList } from '@/components/ui/feed-list';
import CommentsPanel from '@/features/comments/comments-panel';
import { useFeed } from '@/features/feed/api';
import { FeedRightRail } from '@/features/feed/components/feed-right-rail';
import { PostCard } from '@/features/feed/components/post-card';
import type { FeedItem, Post } from '@/features/feed/types';
import { useTokens } from '@/theme/theme-provider';
import { useBrand } from '@/theme/use-brand';

const WEB_COLUMN_WIDTH = 480;
const RAIL_MIN_WIDTH = 1200;

export default function FeedScreen() {
  const tokens = useTokens();
  const brand = useBrand();
  const { t } = useTranslation('nav');
  const { t: tf } = useTranslation('feed');
  const { t: ta } = useTranslation('app');
  const router = useRouter();
  const feed = useFeed();
  const { width } = useWindowDimensions();
  const showRail = Platform.OS === 'web' && width >= RAIL_MIN_WIDTH;
  const [activePost, setActivePost] = useState<Post | null>(null);

  return (
    <Screen padded={false}>
      <View style={styles.fill}>
        <View style={[styles.header, { borderBottomColor: tokens.color.border.default }]}>
          <View style={styles.headerSide} />
          <View style={styles.lockup}>
            <BandadaMark size={28} color={brand.color} accent={brand.accent} />
            <BandadaWordmark width={116} color={brand.color} accent={brand.accent} />
          </View>
          <View style={[styles.headerSide, styles.headerSideRight]}>
            <Pressable
              onPress={() => router.push('/notifications')}
              accessibilityRole="button"
              accessibilityLabel={t('notifications')}
              style={styles.headerAction}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color={tokens.color.text.primary}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.column, showRail && { maxWidth: WEB_COLUMN_WIDTH }]}>
            {feed.loading ? (
              <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
            ) : feed.error ? (
              <View style={styles.state}>
                <Text style={[styles.message, { color: tokens.color.text.muted }]}>
                  {tf('error')}
                </Text>
                <Pressable
                  onPress={feed.refetch}
                  style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
                  <Text style={{ color: tokens.color.action.primary.fg }}>{ta('retry')}</Text>
                </Pressable>
              </View>
            ) : (
              <FeedList<FeedItem>
                style={styles.list}
                data={feed.items}
                renderItem={({ item }) => (
                  <PostCard item={item} onOpenComments={() => setActivePost(item.post)} />
                )}
                keyExtractor={(item) => item.post.id}
                hasMore={feed.hasMore}
                loadingMore={feed.loadingMore}
                refreshing={feed.refreshing}
                onEndReached={feed.loadMore}
                onRefresh={feed.refresh}
                renderEmpty={() => (
                  <Text style={[styles.message, { color: tokens.color.text.muted }]}>
                    {tf('empty')}
                  </Text>
                )}
              />
            )}
          </View>

          {showRail ? <FeedRightRail /> : null}
        </View>
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
  fill: { flex: 1, minHeight: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSide: { flex: 1 },
  headerSideRight: { alignItems: 'flex-end' },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerAction: { padding: 4 },
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
  center: { marginTop: 24 },
  state: { alignItems: 'center', paddingHorizontal: 16 },
  message: { fontSize: 15, marginTop: 16, textAlign: 'center' },
  button: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 12 },
});
