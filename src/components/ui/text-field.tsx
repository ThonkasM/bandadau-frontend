import type { ReactNode } from 'react';
import { StyleSheet, TextInput, type TextInputProps,View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTokens } from '@/theme/theme-provider';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
  helper?: string;
  /** Accessory rendered inside the input, aligned to the right (e.g. password toggle). */
  rightAccessory?: ReactNode;
}

/** Labeled input with error/helper and an optional right accessory. Tokens only. */
export function TextField({ label, error, helper, rightAccessory, style, ...rest }: TextFieldProps) {
  const tokens = useTokens();
  const borderColor = error ? tokens.color.feedback.danger.border : tokens.color.border.default;

  return (
    <View style={styles.wrapper}>
      {label ? <Text variant="label">{label}</Text> : null}
      <View style={styles.inputWrap}>
        <TextInput
          placeholderTextColor={tokens.color.text.muted}
          {...rest}
          style={[
            styles.input,
            {
              borderColor,
              backgroundColor: tokens.color.bg.surface,
              color: tokens.color.text.primary,
            },
            rightAccessory ? styles.inputWithAccessory : null,
            style,
          ]}
        />
        {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
      </View>
      {error ? (
        <Text variant="caption" color={tokens.color.feedback.danger.fg}>
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption">{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  inputWithAccessory: { paddingRight: 46 },
  accessory: { position: 'absolute', right: 8, height: '100%', justifyContent: 'center' },
});
