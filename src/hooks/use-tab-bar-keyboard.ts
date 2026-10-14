import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Style that hides the floating tab bar when the keyboard is open.
 * Base/web no-op; native resolves `use-tab-bar-keyboard.native.ts` (runs on the
 * UI thread via `react-native-keyboard-controller`).
 */
export function useTabBarKeyboardHide(_hideDistance: number): StyleProp<ViewStyle> {
  return undefined;
}
