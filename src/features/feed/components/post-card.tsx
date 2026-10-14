import { formatRelative, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { FeedItem } from '@/features/feed/types';
import { useTokens } from '@/theme/theme-provider';

import { PostCarousel } from './post-carousel';

/** Bandada post card: modern chrome, Instagram-style content (carousel, actions, caption). */
export function PostCard({
  item,
  onOpenComments,
}: {
  item: FeedItem;
  onOpenComments?: () => void;
}) {
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
        styles.card,
        {
          backgroundColor: tokens.color.bg.surface,
          borderColor: tokens.color.border.default,
          shadowColor: tokens.color.text.primary,
        },
      ]}>
      <View style={styles.header}>
        <View
          style={[
            styles.avatarRing,
            { borderColor: tokens.color.brand.accent, backgroundColor: tokens.color.bg.muted },
          ]}>
          <Text style={[styles.initial, { color: tokens.color.text.primary }]}>{initial}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.username, { color: tokens.color.text.primary }]}>
            {post.author.displayName}
          </Text>
          <Text style={[styles.time, { color: tokens.color.text.muted }]}>{relative}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('save')} style={styles.more}>
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={22}
            color={tokens.color.text.muted}
          />
        </Pressable>
      </View>

      <View style={[styles.media, { borderColor: tokens.color.border.default }]}>
        <PostCarousel media={post.media} />
      </View>

      <View style={styles.actions}>
        <IconButton icon="heart-outline" label={t('like')} />
        <IconButton icon="comment-outline" label={t('comment')} onPress={onOpenComments} />
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
          <Pressable onPress={onOpenComments}>
            <Text style={[styles.comments, { color: tokens.color.text.muted }]}>
              {t('comments', { count: post.commentsCount })}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  const tokens = useTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.iconButton}>
      <MaterialCommunityIcons name={icon} size={24} color={tokens.color.text.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 6px 20px rgba(0,0,0,0.06)' } as object,
      ios: { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: 16, fontWeight: '800' },
  headerText: { flex: 1 },
  username: { fontSize: 14.5, fontWeight: '800' },
  time: { fontSize: 12 },
  more: { padding: 4 },
  media: {
    marginHorizontal: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
  },
  iconButton: { padding: 6 },
  spacer: { flex: 1 },
  meta: { paddingHorizontal: 14, paddingBottom: 14, gap: 4 },
  likes: { fontSize: 14, fontWeight: '800' },
  caption: { fontSize: 14, lineHeight: 19.5 },
  comments: { fontSize: 13 },
});
