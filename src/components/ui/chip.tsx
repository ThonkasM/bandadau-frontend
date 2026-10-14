import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTokens } from '@/theme/theme-provider';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  const tokens = useTokens();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        { borderColor: selected ? tokens.color.action.primary.bg : tokens.color.border.default },
        selected && { backgroundColor: tokens.color.bg.muted },
      ]}>
      <Text variant="body" color={tokens.color.text.primary}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
});
