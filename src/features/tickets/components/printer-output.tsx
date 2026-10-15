import { useId, useState } from 'react';
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTokens } from '@/theme/theme-provider';

/**
 * "Boca" de impresora térmica: barra ancha con **ranura hundida** y **rodillo**, hecha con
 * capas + degradados SVG (sin imágenes). Mide su propio ancho para renderizar igual en
 * native y web. Tokenizada (`color.printer.*`, navy de la marca).
 */
export function PrinterOutput({
  width = '100%',
  height = 64,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const tokens = useTokens();
  const [w, setW] = useState(0);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const bodyId = `${uid}b`;
  const slotId = `${uid}s`;
  const rollerId = `${uid}r`;
  const shineId = `${uid}h`;

  const onLayout = (event: LayoutChangeEvent) => setW(event.nativeEvent.layout.width);

  const { frame, cavity, roller, highlight } = tokens.color.printer;
  const frame2 = tokens.color.printer['frame-2'];

  const h = height;
  const radius = Math.min(20, h * 0.32);
  const slotInset = Math.max(8, w * 0.06);
  const slotW = Math.max(0, w - slotInset * 2);
  const slotTop = h * 0.4;
  const slotH = Math.max(0, h - slotTop - 4);
  const rollerH = Math.max(5, slotH * 0.3);
  const rollerW = slotW * 0.94;

  return (
    <View pointerEvents="none" onLayout={onLayout} style={[styles.container, { width, height }, style]}>
      {w > 0 ? (
        <>
          {/* Cuerpo con degradado y borde */}
          <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={frame} />
                <Stop offset="0.2" stopColor={frame} />
                <Stop offset="0.78" stopColor={frame2} />
                <Stop offset="1" stopColor={frame} />
              </LinearGradient>
            </Defs>
            <Rect
              x={0.5}
              y={0.5}
              width={w - 1}
              height={h - 1}
              rx={radius}
              fill={`url(#${bodyId})`}
              stroke={highlight}
              strokeWidth={1}
            />
          </Svg>

          {/* Brillo superior (difuminado en los extremos) */}
          <Svg width={w} height={2} style={styles.topShine}>
            <Defs>
              <LinearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={highlight} stopOpacity="0" />
                <Stop offset="0.5" stopColor={highlight} stopOpacity="0.6" />
                <Stop offset="1" stopColor={highlight} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={w} height={2} fill={`url(#${shineId})`} />
          </Svg>

          {/* Ranura hundida */}
          <View
            style={[
              styles.slot,
              { left: slotInset, top: slotTop, width: slotW, height: slotH, borderRadius: 8 },
            ]}>
            <Svg width={slotW} height={slotH} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id={slotId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={frame2} />
                  <Stop offset="0.45" stopColor={cavity} />
                  <Stop offset="1" stopColor={cavity} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={slotW} height={slotH} rx={8} fill={`url(#${slotId})`} />
            </Svg>

            {/* Rodillo interior */}
            <View style={[styles.roller, { left: slotW * 0.03, width: rollerW, height: rollerH }]}>
              <Svg width={rollerW} height={rollerH}>
                <Defs>
                  <LinearGradient id={rollerId} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={frame2} />
                    <Stop offset="0.6" stopColor={roller} />
                    <Stop offset="1" stopColor={frame2} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width={rollerW} height={rollerH} rx={rollerH / 2} fill={`url(#${rollerId})`} />
              </Svg>
            </View>

            {/* Borde inferior de la ranura */}
            <View style={[styles.slotBottom, { backgroundColor: highlight }]} />
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center', justifyContent: 'center' },
  topShine: { position: 'absolute', top: 3, left: 0 },
  slot: { position: 'absolute', overflow: 'hidden' },
  roller: { position: 'absolute', top: 0 },
  slotBottom: { position: 'absolute', bottom: 1, left: 6, right: 6, height: 1, opacity: 0.18 },
});
