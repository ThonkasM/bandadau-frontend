import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { MAX_INPUT_CHARS } from '@/ai/study-assistant';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTokens } from '@/theme/theme-provider';

import type { TextEditorSheetProps } from './text-editor-sheet';

/**
 * Web UC-17 · Centered modal to write the study text. gorhom's `BottomSheetTextInput` is not
 * compatible with react-native-web (`TextInput.State.currentlyFocusedInput is not a function`),
 * so on web we use a plain `TextInput` inside a `Modal`.
 */
export default function TextEditorSheet({
  visible,
  value,
  onChangeText,
  onClose,
}: TextEditorSheetProps) {
  const tokens = useTokens();
  const { t } = useTranslation('assistant');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={[styles.dim, { backgroundColor: tokens.color.bg.inverse }]} />
        </Pressable>

        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.color.bg.surface,
              borderColor: tokens.color.border.default,
            },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: tokens.color.border.default }]}>
            <Text variant="title">{t('editor.title')}</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('editor.done')}
            >
              <MaterialCommunityIcons name="close" size={22} color={tokens.color.text.secondary} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={t('placeholder')}
              placeholderTextColor={tokens.color.text.muted}
              multiline
              autoFocus
              maxLength={MAX_INPUT_CHARS}
              textAlignVertical="top"
              style={[
                styles.input,
                {
                  color: tokens.color.text.primary,
                  backgroundColor: tokens.color.bg.muted,
                  borderColor: tokens.color.border.default,
                },
              ]}
            />
            <Text variant="caption" style={{ color: tokens.color.text.muted }}>
              {t('counter', { used: value.length, max: MAX_INPUT_CHARS })}
            </Text>
          </View>

          <View style={styles.footer}>
            <Button label={t('editor.done')} onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5 },
  card: {
    width: '100%',
    maxWidth: 640,
    height: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: { flex: 1, padding: 16, gap: 8 },
  input: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    fontSize: 15,
    lineHeight: 21,
  },
  footer: { padding: 16 },
});
