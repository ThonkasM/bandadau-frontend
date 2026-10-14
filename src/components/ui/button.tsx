import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTokens } from '@/theme/theme-provider';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

/** Design-system button. Variants/sizes map to semantic tokens only. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  icon,
}: ButtonProps) {
  const tokens = useTokens();
  const isDisabled = disabled || loading;

  const background =
    variant === 'primary'
      ? tokens.color.action.primary.bg
      : variant === 'secondary'
        ? tokens.color.action.secondary.bg
        : undefined;
  const foreground =
    variant === 'primary'
      ? tokens.color.action.primary.fg
      : variant === 'secondary'
        ? tokens.color.action.secondary.fg
        : tokens.color.text.link;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        background ? { backgroundColor: background } : null,
        variant === 'ghost' ? { borderWidth: 1, borderColor: tokens.color.border.default } : null,
        pressed && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <View style={styles.content}>
          {icon ? <MaterialCommunityIcons name={icon} size={18} color={foreground} /> : null}
          <Text style={[styles.label, { color: foreground }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  md: { paddingVertical: 10, paddingHorizontal: 16 },
  lg: { paddingVertical: 14, paddingHorizontal: 20 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 15.5, fontWeight: '700' },
});
