import { formatRelative, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FeedItem } from '@/features/feed/types';
import { useTokens } from '@/theme/theme-provider';

import { PostCarousel } from './post-carousel';

/** Instagram-style post: header, media carousel, actions, likes and caption. */
export function PostCard({ item }: { item: FeedItem }) {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('feed');
  const locale = i18n.language as Locale;
  const { post } = item;

  const initial = post.author.displayName.slice(0, 1).toUpperCase();
  const relative = formatRelative(post.createdAt, locale);
  const caption = `${post.author.displayName} ${post.text}`;

  return (
    <View
      style={[
        styles.post,
        { backgroundColor: tokens.color.bg.surface, borderBottomColor: tokens.color.border.default },
      ]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: tokens.color.bg.muted }]}>
          <Text style={[styles.initial, { color: tokens.color.text.primary }]}>{initial}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.username, { color: tokens.color.text.primary }]}>
            {post.author.displayName}
          </Text>
          <Text style={[styles.time, { color: tokens.color.text.muted }]}>{relative}</Text>
        </View>
        <MaterialCommunityIcons
          name="dots-horizontal"
          size={22}
          color={tokens.color.text.muted}
        />
      </View>

      <PostCarousel media={post.media} />

      <View style={styles.actions}>
        <IconButton icon="heart-outline" label={t('like')} />
        <IconButton icon="comment-outline" label={t('comment')} />
        <IconButton icon="send-outline" label={t('share')} />
        <View style={styles.spacer} />
        <IconButton icon="bookmark-outline" label={t('save')} />
      </View>

      <View style={styles.meta}>
        <Text style={[styles.likes, { color: tokens.color.text.primary }]}>
          {t('likes', { count: post.reactionCounts.like })}
        </Text>
        <Text style={[styles.caption, { color: tokens.color.text.primary }]}>{caption}</Text>
        {post.commentsCount > 0 ? (
          <Text style={[styles.comments, { color: tokens.color.text.muted }]}>
            {t('comments', { count: post.commentsCount })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function IconButton({
  icon,
  label,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
}) {
  const tokens = useTokens();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} style={styles.iconButton}>
      <MaterialCommunityIcons name={icon} size={26} color={tokens.color.text.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  post: { borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 15, fontWeight: '800' },
  headerText: { flex: 1 },
  username: { fontSize: 14, fontWeight: '700' },
  time: { fontSize: 11.5 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8 },
  iconButton: { padding: 4 },
  spacer: { flex: 1 },
  meta: { paddingHorizontal: 14, paddingBottom: 12, gap: 3 },
  likes: { fontSize: 14, fontWeight: '700' },
  caption: { fontSize: 14, lineHeight: 19 },
  comments: { fontSize: 13 },
});
