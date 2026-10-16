import { DeviceMotion } from 'expo-sensors';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export const MAX_TILT_DEG = 14;

const GAIN = 40; // grados por cada 1.0 de cambio en la gravedad normalizada (~20° de giro = efecto máximo)
const SMOOTHING = 0.18; // 0..1: más alto = más reactivo, más bajo = más suave
const DRIFT = 0.01; // la pose "neutra" se recentra sola (~2 s) para no quedarse pegada en el límite

// Android devuelve la reacción (-gravedad); iOS (CoreMotion) devuelve la gravedad.
const TO_GRAVITY = Platform.OS === 'android' ? -1 : 1;
// Si en tu dispositivo el efecto sale invertido en algún eje, cambia estos signos.
const INVERT_X = 1; // gira el ticket al inclinar a izquierda/derecha
const INVERT_Y = 1; // gira el ticket al inclinar hacia adelante/atrás

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * Mueve `rx`/`ry` (grados) según la inclinación del dispositivo, relativa a la pose inicial.
 *
 * Usa el vector de gravedad (accelerationIncludingGravity) y NO los ángulos de Euler
 * `beta/gamma`: con el teléfono casi vertical (beta ≈ 90°) los Euler entran en gimbal lock
 * y `gamma` salta de forma errática. Además suaviza con un filtro paso-bajo.
 *
 * `paused`: mientras vale true (p. ej. el usuario arrastra el ticket) no se escribe nada.
 * Solo nativo; en web se usa arrastre/hover (ver `use-device-tilt.web.ts`).
 */
export function useDeviceTilt(
  rx: SharedValue<number>,
  ry: SharedValue<number>,
  enabled: boolean,
  paused?: SharedValue<boolean>,
) {
  useEffect(() => {
    if (!enabled) return;
    let base: { x: number; y: number } | null = null;
    let sx = 0;
    let sy = 0;
    let subscription: { remove: () => void } | null = null;
    let cancelled = false;

    DeviceMotion.setUpdateInterval(16);
    DeviceMotion.isAvailableAsync()
      .then((available) => {
        if (!available || cancelled) return;
        subscription = DeviceMotion.addListener(({ accelerationIncludingGravity: a }) => {
          if (!a) return;
          const len = Math.hypot(a.x, a.y, a.z);
          if (len < 1e-3) return;
          const x = (a.x / len) * TO_GRAVITY;
          const y = (a.y / len) * TO_GRAVITY;

          // Mientras se arrastra: re-centrar la pose neutra y no tocar los valores.
          if (!base || paused?.value) {
            base = { x, y };
            sx = 0;
            sy = 0;
            return;
          }

          base.x += (x - base.x) * DRIFT;
          base.y += (y - base.y) * DRIFT;

          const targetRy = clamp((x - base.x) * GAIN * INVERT_X, -MAX_TILT_DEG, MAX_TILT_DEG);
          const targetRx = clamp((y - base.y) * GAIN * INVERT_Y, -MAX_TILT_DEG, MAX_TILT_DEG);
          sx += (targetRx - sx) * SMOOTHING;
          sy += (targetRy - sy) * SMOOTHING;
          rx.value = sx;
          ry.value = sy;
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, rx, ry, paused]);
}