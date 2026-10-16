import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/screens/screen';
import { useMyProfile, useUserPosts } from '@/features/profile/api';
import { ProfileMenu } from '@/features/profile/components/profile-menu';
import { ProfileGridSkeleton, ProfileSkeleton } from '@/features/profile/components/profile-skeleton';
import { useTokens } from '@/theme/theme-provider';
import { useBrand } from '@/theme/use-brand';

type Tab = 'posts' | 'saved';

/** UC-04 · Profile: cover, avatar, stats, tabs and post grid (mockup). */
export default function ProfileScreen() {
  const tokens = useTokens();
  const brand = useBrand();
  const insets = useSafeAreaInsets();
  const { t: tp } = useTranslation('profile');
  const { t: ta } = useTranslation('app');
  const router = useRouter();
  const profile = useMyProfile();
  const [tab, setTab] = useState<Tab>('posts');
  const [menuOpen, setMenuOpen] = useState(false);

  const posts = useUserPosts(profile.data?.userId);

  if (profile.isLoading) {
    return (
      <Screen padded={false}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ProfileSkeleton />
        </ScrollView>
      </Screen>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <Screen padded={false}>
        <Text style={[styles.message, { color: tokens.color.text.muted }]}>{tp('error')}</Text>
        <Pressable
          onPress={() => profile.refetch()}
          style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
          <Text style={{ color: tokens.color.action.primary.fg }}>{ta('retry')}</Text>
        </Pressable>
      </Screen>
    );
  }

  const data = profile.data;
  const gridItems = tab === 'posts' ? posts.items : [];

  const openPost = (postId: string) =>
    router.push({
      pathname: '/profile/[userId]',
      params: { userId: data.userId, name: data.displayName, postId },
    });

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: `https://picsum.photos/seed/bandada-cover-${data.userId}/1200/400` }}
          style={styles.cover}
          contentFit="cover"
          transition={200}
        />

        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={tp('menu.title')}
          style={[styles.menuButton, { backgroundColor: tokens.color.bg.surface }]}>
          <MaterialCommunityIcons name="dots-horizontal" size={22} color={tokens.color.text.primary} />
        </Pressable>

        <View style={styles.identity}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: tokens.color.bg.muted, borderColor: brand.accent },
            ]}>
            <Text style={[styles.initial, { color: tokens.color.text.primary }]}>
              {data.displayName.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.name, { color: tokens.color.text.primary }]}>{data.displayName}</Text>
          {data.career ? <Text style={{ color: tokens.color.text.muted }}>{data.career}</Text> : null}
        </View>

        <View style={styles.stats}>
          <Stat label={tp('posts')} value={data.postsCount} />
          <View style={[styles.divider, { backgroundColor: tokens.color.border.default }]} />
          <Stat label={tp('followers')} value={data.followersCount} />
          <View style={[styles.divider, { backgroundColor: tokens.color.border.default }]} />
          <Stat label={tp('following')} value={data.followingCount} />
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/create')}
          accessibilityRole="button"
          accessibilityLabel={tp('create')}
          style={[styles.createButton, { backgroundColor: tokens.color.action.primary.bg }]}>
          <MaterialCommunityIcons
            name="plus"
            size={18}
            color={tokens.color.action.primary.fg}
          />
          <Text style={[styles.createLabel, { color: tokens.color.action.primary.fg }]}>
            {tp('create')}
          </Text>
        </Pressable>

        <View style={[styles.tabs, { borderBottomColor: tokens.color.border.default }]}>
          {(['posts', 'saved'] as Tab[]).map((option) => {
            const active = tab === option;
            return (
              <Pressable key={option} onPress={() => setTab(option)} style={styles.tab}>
                <MaterialCommunityIcons
                  name={option === 'posts' ? 'grid' : 'bookmark-outline'}
                  size={22}
                  color={active ? tokens.color.text.primary : tokens.color.text.muted}
                />
                {active ? (
                  <View style={[styles.tabUnderline, { backgroundColor: tokens.color.text.primary }]} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {tab === 'posts' && posts.loading ? (
          <ProfileGridSkeleton />
        ) : gridItems.length > 0 ? (
          <View style={styles.grid}>
            {gridItems.map((item) => (
              <Pressable
                key={item.post.id}
                accessibilityRole="button"
                onPress={() => openPost(item.post.id)}
                style={[styles.gridItem, { backgroundColor: tokens.color.bg.muted }]}>
                <Image
                  source={{ uri: item.post.media[0]?.thumbnailUrl ?? item.post.media[0]?.url ?? undefined }}
                  style={styles.gridImage}
                  contentFit="cover"
                  transition={150}
                />
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={[styles.message, { color: tokens.color.text.muted }]}>
            {tab === 'saved' ? tp('savedEmpty') : tp('postsEmpty')}
          </Text>
        )}
      </ScrollView>

      <ProfileMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchor={{ top: insets.top + 54, right: 12 }}
      />
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
  message: { fontSize: 15, margin: 24, textAlign: 'center' },
  button: { borderRadius: 12, paddingVertical: 12, marginHorizontal: 24, alignItems: 'center' },
  scroll: { paddingBottom: 96 },
  cover: { width: '100%', height: 140 },
  menuButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  createLabel: { fontSize: 15, fontWeight: '800' },
  identity: { alignItems: 'center', marginTop: -44, gap: 4 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: 34, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  stats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12 },
  divider: { width: 1, height: 28 },
  tabs: { flexDirection: 'row', marginTop: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabUnderline: { position: 'absolute', bottom: 0, height: 2, width: '40%', borderRadius: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 2 },
  gridItem: { width: '32.6%', aspectRatio: 1, borderRadius: 4, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%' },
});
