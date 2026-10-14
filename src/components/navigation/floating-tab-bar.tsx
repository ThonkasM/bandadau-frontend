import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { PlatformPressable } from 'expo-router/react-navigation';
import { useTabTrigger } from 'expo-router/ui';
import { memo, useCallback, useMemo } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarCollapse } from '@/components/navigation/tab-bar-collapse';
import { useTokens } from '@/theme/theme-provider';

type ThemeTokens = ReturnType<typeof useTokens>;

const ICON_SIZE = 26;
const CAPSULE_HEIGHT = 56;
const BAR_PADDING = 6;
const ITEM_GAP = 2;
const H_MARGIN = 16;
const BAR_MAX_WIDTH = 520;
const BOTTOM_GAP = 10;
const SHRINK_SCALE = 0.84;
const SPRING = { damping: 18, stiffness: 240, mass: 0.7 };

export interface FloatingTabBarProps {
  children: React.ReactNode;
  hidden?: boolean;
}

/** Floating opaque capsule (iOS 26 / Instagram style) that shrinks on scroll down. */
export function FloatingTabBar({ children, hidden = false }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const tokens = useTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const collapsed = useTabBarCollapse();
  const reducedMotion = useReducedMotion();

  const progress = useDerivedValue(() =>
    reducedMotion ? collapsed.value : withSpring(collapsed.value, SPRING),
  );

  const shrinkStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [1, SHRINK_SCALE]);
    return { transform: [{ translateY: ((1 - scale) * CAPSULE_HEIGHT) / 2 }, { scale }] };
  });

  if (hidden) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + BOTTOM_GAP }]}>
      <Animated.View style={[styles.capsule, shrinkStyle]}>{children}</Animated.View>
    </View>
  );
}

export interface FloatingTabButtonProps {
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconActive?: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
}

export const FloatingTabButton = memo(function FloatingTabButton({
  name,
  icon,
  iconActive,
  label,
}: FloatingTabButtonProps) {
  const tokens = useTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const { triggerProps } = useTabTrigger({ name });
  const active = Boolean(triggerProps.isFocused);
  const tint = active ? tokens.color.action.primary.bg : tokens.color.text.muted;

  const handlePressIn = useCallback(() => {
    if (!active && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [active]);

  // `href: null` keeps `PlatformPressable` from rendering an `<a>` and calling
  // `preventDefault()` (which made `TabTrigger` bail on web); we call
  // `triggerProps.onPress` directly instead.
  const pressableProps = {
    href: null,
    onPress: triggerProps.onPress ?? undefined,
    onLongPress: triggerProps.onLongPress ?? undefined,
  } as unknown as React.ComponentProps<typeof PlatformPressable>;

  return (
    <PlatformPressable
      {...pressableProps}
      onPressIn={handlePressIn}
      style={styles.item}
      pressOpacity={0.6}
      accessibilityRole="button"
      accessibilityState={active ? { selected: true } : {}}
      accessibilityLabel={label}>
      <MaterialCommunityIcons
        name={active && iconActive ? iconActive : icon}
        size={ICON_SIZE}
        color={tint}
      />
    </PlatformPressable>
  );
});

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      paddingHorizontal: H_MARGIN,
      zIndex: 10,
      pointerEvents: 'box-none',
    },
    capsule: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      maxWidth: BAR_MAX_WIDTH,
      height: CAPSULE_HEIGHT,
      padding: BAR_PADDING,
      gap: ITEM_GAP,
      borderRadius: CAPSULE_HEIGHT / 2,
      backgroundColor: tokens.color.bg.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.color.border.default,
      ...Platform.select<ViewStyle>({
        android: { elevation: 6 },
        ios: {
          shadowColor: tokens.color.text.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.14,
          shadowRadius: 14,
        },
        default: {},
      }),
    },
    item: {
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: (CAPSULE_HEIGHT - BAR_PADDING * 2) / 2,
      overflow: 'hidden',
    },
  });
