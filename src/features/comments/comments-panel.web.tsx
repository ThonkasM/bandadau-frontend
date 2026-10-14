import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { groupThreads, useComments } from '@/features/comments/api';
import { CommentComposer } from '@/features/comments/components/comment-composer';
import { CommentThreadView } from '@/features/comments/components/comment-thread';
import type { Comment, CommentThread } from '@/features/comments/types';
import { PostCarousel } from '@/features/feed/components/post-carousel';
import { useDeviceType } from '@/hooks/use-device-type';
import { useTokens } from '@/theme/theme-provider';

import type { CommentsPanelProps } from './comments-panel';
import CommentsSheet from './comments-sheet';

const RIGHT_PANE_WIDTH = 400;

/** Web desktop: Instagram-style modal (left media carousel, right comments). */
function CommentsModal({ post, visible, onClose }: CommentsPanelProps) {
  const tokens = useTokens();
  const { t } = useTranslation('comments');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const comments = useComments(post?.id);
  const threads = useMemo(() => groupThreads(comments.items), [comments.items]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={[styles.dim, { backgroundColor: tokens.color.bg.inverse }]} />
        </Pressable>

        <View
          style={[
            styles.card,
            { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
          ]}>
          {post ? (
            <View style={[styles.left, { backgroundColor: tokens.color.bg.muted }]}>
              <PostCarousel media={post.media} />
            </View>
          ) : null}

          <View style={[styles.right, { borderLeftColor: tokens.color.border.default }]}>
            <View style={[styles.header, { borderBottomColor: tokens.color.border.default }]}>
              <Text variant="title">{t('title')}</Text>
              <Pressable onPress={onClose} accessibilityLabel={t('close')}>
                <MaterialCommunityIcons name="close" size={22} color={tokens.color.text.secondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {threads.length === 0 ? (
                <Text variant="caption" style={styles.empty}>
                  {comments.loading ? t('loading') : t('empty')}
                </Text>
              ) : (
                threads.map((thread: CommentThread) => (
                  <CommentThreadView key={thread.comment.id} thread={thread} onReply={setReplyTo} />
                ))
              )}
            </ScrollView>

            {post ? (
              <CommentComposer
                postId={post.id}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
              />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Web: desktop → centered modal (two panes); mobile → the same **gorhom**
 * bottom sheet as native (consistent with Homy).
 */
export default function CommentsPanelWeb(props: CommentsPanelProps) {
  const { isWebDesktop } = useDeviceType();
  return isWebDesktop ? <CommentsModal {...props} /> : <CommentsSheet {...props} />;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5 },
  card: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 1100,
    height: '86%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  left: { flex: 1, justifyContent: 'center' },
  right: { width: RIGHT_PANE_WIDTH, borderLeftWidth: StyleSheet.hairlineWidth },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  list: { flex: 1 },
  listContent: { paddingVertical: 6 },
  empty: { textAlign: 'center', paddingVertical: 24 },
});
