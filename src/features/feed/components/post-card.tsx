import { formatRelative, type Locale } from '@bandada/i18n';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { FeedItem } from '@/features/feed/types';
import { useTokens } from '@/theme/theme-provider';

/** One feed post. Tokens only; text formatting via `@bandada/i18n`. */
export function PostCard({ item }: { item: FeedItem }) {
  const tokens = useTokens();
  const { i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const { post } = item;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
      ]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: tokens.color.bg.muted }]} />
        <View style={styles.headerText}>
          <Text style={[styles.author, { color: tokens.color.text.primary }]}>
            {post.author.displayName}
          </Text>
          <Text style={[styles.time, { color: tokens.color.text.muted }]}>
            {formatRelative(post.createdAt, locale)}
          </Text>
        </View>
      </View>
      <Text style={[styles.body, { color: tokens.color.text.primary }]}>{post.text}</Text>
      <Text style={[styles.reactions, { color: tokens.color.text.muted }]}>
        {String(post.reactionCounts.like)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    marginBottom: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  headerText: { flex: 1 },
  author: { fontSize: 14.5, fontWeight: '700' },
  time: { fontSize: 12 },
  body: { fontSize: 15, lineHeight: 21 },
  reactions: { fontSize: 12.5 },
});
