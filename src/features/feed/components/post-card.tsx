import { formatRelative, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/common/avatar';
import { useRemoveReaction, useSetReaction } from '@/features/feed/api';
import type { FeedItem } from '@/features/feed/types';
import { shadowStyle } from '@/lib/shadow';
import { useTokens } from '@/theme/theme-provider';

import { PostCarousel } from './post-carousel';
import { ReportSheet } from './report-sheet';

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
  const setReaction = useSetReaction();
  const removeReaction = useRemoveReaction();
  const [reportOpen, setReportOpen] = useState(false);
  const router = useRouter();
  const openAuthor = () =>
    router.push({
      pathname: '/user/[userId]',
      params: { userId: post.author.userId, name: post.author.displayName },
    });

  const relative = formatRelative(post.createdAt, locale);
  const caption = `${post.author.displayName} ${post.text}`;
  const liked = post.myReaction === 'LIKE';
  const onLike = () => {
    if (liked) removeReaction.mutate({ postId: post.id });
    else setReaction.mutate({ postId: post.id, type: 'LIKE' });
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tokens.color.bg.surface,
          borderColor: tokens.color.border.default,
          ...shadowStyle(tokens.shadow.md),
        },
      ]}>
      <View style={styles.header}>
        <Pressable
          onPress={openAuthor}
          accessibilityRole="button"
          accessibilityLabel={post.author.displayName}
          style={styles.authorLink}>
          <Avatar name={post.author.displayName} url={post.author.avatarUrl} size={36} />
          <View style={styles.headerText}>
            <Text style={[styles.username, { color: tokens.color.text.primary }]}>
              {post.author.displayName}
            </Text>
            <Text style={[styles.time, { color: tokens.color.text.muted }]}>{relative}</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('report.title')}
          onPress={() => setReportOpen(true)}
          style={styles.more}>
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={22}
            color={tokens.color.text.muted}
          />
        </Pressable>
      </View>

      <PostCarousel media={post.media} />

      <View style={styles.actions}>
        <IconButton
          icon={liked ? 'heart' : 'heart-outline'}
          label={t('like')}
          onPress={onLike}
          color={liked ? tokens.color.brand.highlight : undefined}
        />
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

      <ReportSheet
        visible={reportOpen}
        targetType="POST"
        targetId={post.id}
        onClose={() => setReportOpen(false)}
      />
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  color,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress?: () => void;
  color?: string;
}) {
  const tokens = useTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.iconButton}>
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={color ?? tokens.color.text.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  authorLink: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { flex: 1 },
  username: { fontSize: 14.5, fontWeight: '800' },
  time: { fontSize: 12 },
  more: { padding: 4 },
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
