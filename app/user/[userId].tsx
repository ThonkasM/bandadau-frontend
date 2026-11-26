import { Image } from 'expo-image';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/common/avatar';
import { AppHeader } from '@/components/screens/app-header';
import { Screen } from '@/components/screens/screen';
import { useMyProfile, useProfile, useUserPosts } from '@/features/profile/api';
import { ProfileGridSkeleton, ProfileSkeleton } from '@/features/profile/components/profile-skeleton';
import { useFollow, useUnfollow } from '@/features/social/api';
import { cachedSource } from '@/lib/image-cache';
import { useTokens } from '@/theme/theme-provider';
import { useBrand } from '@/theme/use-brand';

/** UC-04/UC-08 · Another student's public profile: identity, stats, follow button and post grid. */
export default function UserProfileScreen() {
  const tokens = useTokens();
  const brand = useBrand();
  const router = useRouter();
  const { t } = useTranslation('profile');
  const { t: ta } = useTranslation('app');
  const params = useLocalSearchParams<{ userId: string; name?: string }>();
  const userId = params.userId;
  const me = useMyProfile();
  const profile = useProfile(userId);
  const posts = useUserPosts(userId);
  const follow = useFollow(userId);
  const unfollow = useUnfollow(userId);

  // Your own profile lives in the tab (where the photo and details can be edited).
  if (me.data && me.data.userId === userId) return <Redirect href="/profile" />;

  const data = profile.data;
  const following = data?.followedByMe ?? false;
  const toggleFollow = () => (following ? unfollow.mutate() : follow.mutate());
  const busy = follow.isPending || unfollow.isPending;

  const openPost = (postId: string) =>
    router.push({
      pathname: '/profile/[userId]',
      params: { userId, name: data?.displayName ?? params.name, postId },
    });

  return (
    <Screen padded={false}>
      <AppHeader title={data?.displayName ?? params.name ?? t('viewProfile')} />
      {profile.isLoading ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <ProfileSkeleton />
        </ScrollView>
      ) : profile.isError || !data ? (
        <View>
          <Text style={[styles.message, { color: tokens.color.text.muted }]}>{t('userNotFound')}</Text>
          <Pressable
            onPress={() => profile.refetch()}
            style={[styles.retry, { backgroundColor: tokens.color.action.primary.bg }]}>
            <Text style={{ color: tokens.color.action.primary.fg }}>{ta('retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Image
            source={{ uri: `https://picsum.photos/seed/bandada-cover-${data.userId}/1200/400` }}
            style={styles.cover}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.identity}>
            <Avatar
              name={data.displayName}
              url={data.avatarUrl}
              size={88}
              ringColor={brand.accent}
              ringWidth={3}
            />
            <Text style={[styles.name, { color: tokens.color.text.primary }]}>{data.displayName}</Text>
            {data.career ? (
              <Text style={{ color: tokens.color.text.muted }}>
                {data.career}
                {data.semester ? ` · ${data.semester}°` : ''}
              </Text>
            ) : null}
            {data.bio ? (
              <Text style={[styles.bio, { color: tokens.color.text.primary }]}>{data.bio}</Text>
            ) : null}
          </View>

          <View style={styles.stats}>
            <Stat label={t('posts')} value={data.postsCount} />
            <View style={[styles.divider, { backgroundColor: tokens.color.border.default }]} />
            <Stat label={t('followers')} value={data.followersCount} />
            <View style={[styles.divider, { backgroundColor: tokens.color.border.default }]} />
            <Stat label={t('following')} value={data.followingCount} />
          </View>

          <Pressable
            onPress={toggleFollow}
            disabled={busy}
            accessibilityRole="button"
            style={[
              styles.followButton,
              {
                backgroundColor: following
                  ? tokens.color.action.secondary.bg
                  : tokens.color.action.primary.bg,
                opacity: busy ? 0.7 : 1,
              },
            ]}>
            <Text
              style={{
                color: following ? tokens.color.action.secondary.fg : tokens.color.action.primary.fg,
                fontWeight: '800',
                fontSize: 15,
              }}>
              {following ? t('following') : t('follow')}
            </Text>
          </Pressable>

          <View style={[styles.gridDivider, { borderTopColor: tokens.color.border.default }]} />

          {posts.loading ? (
            <ProfileGridSkeleton />
          ) : posts.items.length > 0 ? (
            <View style={styles.grid}>
              {posts.items.map((item) => (
                <Pressable
                  key={item.post.id}
                  accessibilityRole="button"
                  onPress={() => openPost(item.post.id)}
                  style={[styles.gridItem, { backgroundColor: tokens.color.bg.muted }]}>
                  {item.post.media.length > 0 ? (
                    <Image
                      source={cachedSource(item.post.media[0]?.thumbnailUrl ?? item.post.media[0]?.url)}
                      cachePolicy="memory-disk"
                      style={styles.gridImage}
                      contentFit="cover"
                      transition={150}
                    />
                  ) : (
                    <Text
                      numberOfLines={5}
                      style={[styles.gridText, { color: tokens.color.text.primary }]}>
                      {item.post.text}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={[styles.message, { color: tokens.color.text.muted }]}>{t('noPostsYet')}</Text>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const tokens = useTokens();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: tokens.color.text.primary }]}>{String(value)}</Text>
      <Text style={[styles.statLabel, { color: tokens.color.text.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 96 },
  message: { fontSize: 15, margin: 24, textAlign: 'center' },
  retry: { borderRadius: 12, paddingVertical: 12, marginHorizontal: 24, alignItems: 'center' },
  cover: { width: '100%', height: 120 },
  identity: { alignItems: 'center', marginTop: -44, gap: 4, paddingHorizontal: 24 },
  name: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  bio: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  stats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12 },
  divider: { width: 1, height: 28 },
  followButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  gridDivider: { marginTop: 20, borderTopWidth: StyleSheet.hairlineWidth },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 2 },
  // Igual que el perfil propio ((tabs)/profile.tsx): sin padding en el cuadro ni imagen absoluta, que colapsaban la altura.
  gridItem: { width: '32.6%', aspectRatio: 1, borderRadius: 4, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%' },
  gridText: { fontSize: 11, padding: 6 },
});
