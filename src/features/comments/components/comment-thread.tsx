import { formatRelative, type Locale } from '@bandada/i18n';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';

import type { Comment, CommentThread } from '@/features/comments/types';
import { useTokens } from '@/theme/theme-provider';

function CommentRow({
  comment,
  indent = false,
  onReply,
}: {
  comment: Comment;
  indent?: boolean;
  onReply: (comment: Comment) => void;
}) {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('comments');
  const locale = i18n.language as Locale;
  const initial = comment.author.displayName.slice(0, 1).toUpperCase();
  const body = `${comment.author.displayName} ${comment.text}`;

  return (
    <View style={[styles.row, indent && styles.indented]}>
      <View style={[styles.avatar, { backgroundColor: tokens.color.bg.muted }]}>
        <RNText style={[styles.initial, { color: tokens.color.text.primary }]}>{initial}</RNText>
      </View>
      <View style={styles.content}>
        <RNText style={[styles.body, { color: tokens.color.text.primary }]}>{body}</RNText>
        <View style={styles.metaRow}>
          <RNText style={[styles.time, { color: tokens.color.text.muted }]}>
            {formatRelative(comment.createdAt, locale)}
          </RNText>
          <Pressable onPress={() => onReply(comment)}>
            <RNText style={[styles.reply, { color: tokens.color.text.muted }]}>{t('reply')}</RNText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** A root comment with its direct replies (one nesting level). */
export function CommentThreadView({
  thread,
  onReply,
}: {
  thread: CommentThread;
  onReply: (comment: Comment) => void;
}) {
  return (
    <View style={styles.thread}>
      <CommentRow comment={thread.comment} onReply={onReply} />
      {thread.replies.map((reply) => (
        <CommentRow key={reply.id} comment={reply} indent onReply={onReply} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  thread: { paddingVertical: 4 },
  row: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 6 },
  indented: { marginLeft: 44, paddingLeft: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 13, fontWeight: '800' },
  content: { flex: 1, gap: 2 },
  body: { fontSize: 14, lineHeight: 19 },
  metaRow: { flexDirection: 'row', gap: 14 },
  time: { fontSize: 12 },
  reply: { fontSize: 12, fontWeight: '700' },
});
