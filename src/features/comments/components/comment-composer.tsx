import type { Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useCreateComment } from '@/features/comments/api';
import type { Comment } from '@/features/comments/types';
import { ApiError } from '@/lib/api-error';
import { useTokens } from '@/theme/theme-provider';

/** Composer for a comment or a reply. `InputComponent` lets the native sheet use `BottomSheetTextInput`. */
export function CommentComposer({
  postId,
  replyTo,
  onCancelReply,
  InputComponent = TextInput,
}: {
  postId: string;
  replyTo: Comment | null;
  onCancelReply?: () => void;
  InputComponent?: typeof TextInput;
}) {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('comments');
  const [text, setText] = useState('');
  const create = useCreateComment(postId);
  const error = create.error
    ? create.error instanceof ApiError
      ? create.error.localizedMessage(i18n.language as Locale)
      : t('error')
    : null;

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    create.mutate(
      { text: value, parentId: replyTo?.id },
      {
        onSuccess: () => {
          setText('');
          onCancelReply?.();
        },
      },
    );
  };

  return (
    <View style={[styles.wrap, { borderTopColor: tokens.color.border.default }]}>
      {replyTo ? (
        <View style={styles.replyBar}>
          <Text variant="caption" style={styles.replyText}>
            {t('replyTo', { name: replyTo.author.displayName })}
          </Text>
          <Pressable onPress={onCancelReply}>
            <Text variant="link">{t('cancel')}</Text>
          </Pressable>
        </View>
      ) : null}
      {error ? (
        <Text variant="caption" color={tokens.color.feedback.danger.fg}>
          {error}
        </Text>
      ) : null}
      <View style={styles.row}>
        <InputComponent
          value={text}
          onChangeText={setText}
          placeholder={t('placeholder')}
          placeholderTextColor={tokens.color.text.muted}
          style={[styles.input, { color: tokens.color.text.primary }]}
          multiline
        />
        <Pressable
          onPress={submit}
          disabled={create.isPending || text.trim().length === 0}
          accessibilityRole="button"
          accessibilityLabel={t('send')}
          style={styles.send}>
          <MaterialCommunityIcons name="send" size={22} color={tokens.color.action.primary.bg} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  replyBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  replyText: { fontSize: 12.5, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, maxHeight: 96, fontSize: 14.5, paddingVertical: 6 },
  send: { padding: 6 },
});
