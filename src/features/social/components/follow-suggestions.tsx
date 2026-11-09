import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/common/avatar';
import { type FollowSuggestion,useFollow, useFollowSuggestions } from '@/features/social/api';
import { useTokens } from '@/theme/theme-provider';

/** UC-08: "Who to follow" strip shown above the feed. Hidden when there is nobody to suggest. */
export function FollowSuggestions() {
  const tokens = useTokens();
  const { t } = useTranslation('profile');
  const { data } = useFollowSuggestions();
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: tokens.color.text.primary }]}>{t('suggestionsTitle')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => (
          <SuggestionCard key={item.profile.userId} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

function SuggestionCard({ item }: { item: FollowSuggestion }) {
  const tokens = useTokens();
  const router = useRouter();
  const { t } = useTranslation('profile');
  const follow = useFollow(item.profile.userId);
  const { profile } = item;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
      ]}>
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/user/[userId]',
            params: { userId: profile.userId, name: profile.displayName },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`${t('viewProfile')}: ${profile.displayName}`}
        style={styles.who}>
        <Avatar name={profile.displayName} url={profile.avatarUrl} size={56} />
        <Text numberOfLines={1} style={[styles.name, { color: tokens.color.text.primary }]}>
          {profile.displayName}
        </Text>
        {item.career ? (
          <Text numberOfLines={1} style={[styles.career, { color: tokens.color.text.muted }]}>
            {item.career}
          </Text>
        ) : null}
      </Pressable>
      <Pressable
        onPress={() => follow.mutate()}
        disabled={follow.isPending}
        accessibilityRole="button"
        style={[styles.follow, { backgroundColor: tokens.color.action.primary.bg }]}>
        <Text style={{ color: tokens.color.action.primary.fg, fontWeight: '800', fontSize: 13 }}>
          {t('follow')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '800', marginBottom: 8, paddingHorizontal: 2 },
  row: { gap: 10, paddingRight: 8 },
  card: {
    width: 132,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  who: { alignItems: 'center', gap: 4, alignSelf: 'stretch' },
  name: { fontSize: 13.5, fontWeight: '800', textAlign: 'center' },
  career: { fontSize: 11.5, textAlign: 'center' },
  follow: { borderRadius: 10, paddingVertical: 7, paddingHorizontal: 18 },
});
