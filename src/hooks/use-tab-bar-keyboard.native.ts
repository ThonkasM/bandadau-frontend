import type { StyleProp, ViewStyle } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useAnimatedStyle } from 'react-native-reanimated';

/**
 * Hides the floating tab bar by sliding it off-screen with the keyboard progress
 * (0 closed → 1 open). Runs on the UI thread via `react-native-keyboard-controller`
 * (provided by `KeyboardProvider`).
 */
export function useTabBarKeyboardHide(hideDistance: number): StyleProp<ViewStyle> {
  const { progress } = useReanimatedKeyboardAnimation();

  const keyboardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * hideDistance }],
  }));

  return keyboardStyle as StyleProp<ViewStyle>;
}
