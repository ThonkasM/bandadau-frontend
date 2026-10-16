import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_INPUT_CHARS } from '@/ai/study-assistant';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { usePresentableSheet } from '@/hooks/use-presentable-sheet';
import { useTokens } from '@/theme/theme-provider';

export interface TextEditorSheetProps {
  visible: boolean;
  value: string;
  onChangeText: (value: string) => void;
  onClose: () => void;
}

/**
 * UC-17 · Bottom sheet to write the study text (same pattern as the comments sheet: gorhom +
 * `usePresentableSheet` + `BottomSheetTextInput`, which coordinates scroll/keyboard). The assistant
 * screen only shows a compact preview, so this keeps the layout light and the keyboard controllable.
 */
export function TextEditorSheet({ visible, value, onChangeText, onClose }: TextEditorSheetProps) {
  const tokens = useTokens();
  const { t } = useTranslation('assistant');
  const insets = useSafeAreaInsets();
  const { ref, onDismiss, onChange } = usePresentableSheet(visible, onClose);

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
      snapPoints={['92%']}
      enableDynamicSizing={false}
      enablePanDownToClose
      handleComponent={null}
      backdropComponent={backdrop}
      backgroundStyle={backgroundStyle}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onChange={onChange}
      onDismiss={onDismiss}
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
        <BottomSheetTextInput
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

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button label={t('editor.done')} onPress={onClose} />
      </View>
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
  body: { flex: 1, padding: 16, gap: 8 },
  input: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    fontSize: 15,
    lineHeight: 21,
  },
  footer: { paddingHorizontal: 16 },
});
