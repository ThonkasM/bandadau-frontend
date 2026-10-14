import { StyleSheet, TextInput, type TextInputProps,View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTokens } from '@/theme/theme-provider';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
  helper?: string;
}

/** Labeled input with error/helper. Tokens only. */
export function TextField({ label, error, helper, style, ...rest }: TextFieldProps) {
  const tokens = useTokens();
  const borderColor = error ? tokens.color.feedback.danger.border : tokens.color.border.default;

  return (
    <View style={styles.wrapper}>
      {label ? <Text variant="label">{label}</Text> : null}
      <TextInput
        placeholderTextColor={tokens.color.text.muted}
        {...rest}
        style={[
          styles.input,
          { borderColor, backgroundColor: tokens.color.bg.surface, color: tokens.color.text.primary },
          style,
        ]}
      />
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
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
});
