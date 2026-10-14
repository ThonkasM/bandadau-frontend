import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BandadaWordmark } from '@/components/brand/BandadaLogo';
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
  const router = useRouter();
  const feed = useFeed();

  return (
    <Screen padded={false}>
      <View
        style={[styles.header, { borderBottomColor: tokens.color.border.default }]}>
        <BandadaWordmark
          width={118}
          color={tokens.color.brand.primary}
          accent={tokens.color.brand.accent}
        />
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

      {feed.loading ? (
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      ) : feed.error ? (
        <View style={styles.state}>
          <Text style={[styles.message, { color: tokens.color.text.muted }]}>{tf('error')}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerAction: { padding: 4 },
  list: { flex: 1 },
  center: { marginTop: 24 },
  state: { alignItems: 'center', paddingHorizontal: 16 },
  message: { fontSize: 15, marginTop: 16, textAlign: 'center' },
  button: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 12 },
});
