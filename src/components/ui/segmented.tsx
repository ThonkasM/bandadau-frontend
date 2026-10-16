import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTokens } from '@/theme/theme-provider';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Pill segmented control (tokens only): the selected segment lifts onto the surface color. */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const tokens = useTokens();
  return (
    <View style={[styles.track, { backgroundColor: tokens.color.bg.muted }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && { backgroundColor: tokens.color.bg.surface }]}>
            {option.icon ? (
              <MaterialCommunityIcons
                name={option.icon}
                size={15}
                color={selected ? tokens.color.brand.primary : tokens.color.text.muted}
              />
            ) : null}
            <Text
              variant="caption"
              color={selected ? tokens.color.text.primary : tokens.color.text.muted}
              style={styles.label}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: 12, padding: 3, gap: 3 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  label: { fontWeight: '700' },
});
