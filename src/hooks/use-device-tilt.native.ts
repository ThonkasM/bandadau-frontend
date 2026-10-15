import { DeviceMotion } from 'expo-sensors';
import { useEffect } from 'react';
import type { SharedValue } from 'react-native-reanimated';

const SCALE = 0.6;
const MAX_DEG = 14;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const toDeg = (rad: number) => rad * (180 / Math.PI);

/**
 * Drives `rx`/`ry` (degrees) from the device's motion, relative to the pose at
 * start (so the card is neutral when you open it). Native-only; web falls back
 * to drag (see `use-device-tilt.web.ts`).
 */
export function useDeviceTilt(
  rx: SharedValue<number>,
  ry: SharedValue<number>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    let baseline: { beta: number; gamma: number } | null = null;
    let subscription: { remove: () => void } | null = null;
    let cancelled = false;

    DeviceMotion.setUpdateInterval(50);
    DeviceMotion.isAvailableAsync()
      .then((available) => {
        if (!available || cancelled) return;
        subscription = DeviceMotion.addListener(({ rotation }) => {
          if (!rotation) return;
          const { beta, gamma } = rotation;
          if (!baseline) baseline = { beta, gamma };
          rx.value = clamp(toDeg(beta - baseline.beta) * SCALE, -MAX_DEG, MAX_DEG);
          ry.value = clamp(toDeg(gamma - baseline.gamma) * SCALE, -MAX_DEG, MAX_DEG);
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, rx, ry]);
}
