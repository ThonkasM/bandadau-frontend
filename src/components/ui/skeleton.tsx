import { useEffect } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTokens } from '@/theme/theme-provider';

export interface SkeletonProps {
  /** Placeholder width (number or percentage). Defaults to full width. */
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  radius?: number;
  /** Circular placeholder (uses half of the numeric `height`). */
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
}

const PULSE_MS = 850;
const DIM = 0.45;

/**
 * Neutral placeholder with a soft opacity pulse (D13 tokens). Keeps the layout
 * stable while server data loads, so real content does not jump into place.
 * Honours "reduce motion" by rendering a static block.
 */
export function Skeleton({
  width = '100%',
  height,
  radius = 8,
  circle = false,
  style,
}: SkeletonProps) {
  const tokens = useTokens();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(
      withTiming(DIM, { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity, reduceMotion]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const shape: ViewStyle = {
    width,
    borderRadius: circle && typeof height === 'number' ? height / 2 : radius,
    backgroundColor: tokens.color.bg.muted,
  };
  if (height !== undefined) shape.height = height;

  return (
    <Animated.View
      accessibilityRole="progressbar"
      pointerEvents="none"
      style={[styles.base, shape, animated, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});
