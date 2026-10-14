import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, type TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { groupThreads, useComments } from '@/features/comments/api';
import { CommentComposer } from '@/features/comments/components/comment-composer';
import { CommentThreadView } from '@/features/comments/components/comment-thread';
import type { Comment, CommentThread } from '@/features/comments/types';
import { usePresentableSheet } from '@/hooks/use-presentable-sheet';
import { useTokens } from '@/theme/theme-provider';

import type { CommentsPanelProps } from './comments-panel';

/**
 * Comments bottom sheet with `@gorhom/bottom-sheet` (native **and** web mobile,
 * like Homy). Uses `usePresentableSheet` for robust open/close (the sheet can be
 * re-opened after being dismissed). Web desktop uses a centered modal instead.
 */
export default function CommentsSheet({ post, visible, onClose }: CommentsPanelProps) {
  const tokens = useTokens();
  const { t } = useTranslation('comments');
  const insets = useSafeAreaInsets();
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const comments = useComments(post?.id);
  const threads = useMemo(() => groupThreads(comments.items), [comments.items]);

  const handleClose = useCallback(() => {
    setReplyTo(null);
    onClose();
  }, [onClose]);

  const { ref, onDismiss, onChange } = usePresentableSheet(visible, handleClose);

  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: tokens.color.bg.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    }),
    [tokens.color.bg.surface],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['80%']}
      enablePanDownToClose
      handleComponent={null}
      backdropComponent={backdrop}
      backgroundStyle={backgroundStyle}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onChange={onChange}
      onDismiss={onDismiss}>
      <View style={[styles.header, { borderBottomColor: tokens.color.border.default }]}>
        <Text variant="title">{t('title')}</Text>
        <Pressable onPress={onClose} accessibilityLabel={t('close')}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.color.text.secondary} />
        </Pressable>
      </View>

      <BottomSheetFlatList
        style={styles.list}
        data={threads}
        keyExtractor={(item: CommentThread) => item.comment.id}
        renderItem={({ item }: { item: CommentThread }) => (
          <CommentThreadView thread={item} onReply={setReplyTo} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text variant="caption" style={styles.empty}>
            {comments.loading ? t('loading') : t('empty')}
          </Text>
        }
      />

      {post ? (
        <View style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
          <CommentComposer
            postId={post.id}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            InputComponent={BottomSheetTextInput as unknown as typeof TextInput}
          />
        </View>
      ) : null}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
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
