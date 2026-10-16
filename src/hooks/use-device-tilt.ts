import type { SharedValue } from 'react-native-reanimated';

/** Web has no device motion: the tilt is driven by drag only. */
export function useDeviceTilt(
  rx: SharedValue<number>,
  ry: SharedValue<number>,
  enabled: boolean,
  paused?: SharedValue<boolean>,
) {
  void rx;
  void ry;
  void enabled;
  void paused;
}
