import { useId } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTokens } from '@/theme/theme-provider';

/**
 * "Boca" de la impresora: marco, cavidad, rodillo y reflejos construidos con capas +
 * degradados SVG (sin imágenes ni dependencias). Tokenizado (`color.printer.*`).
 */
export function PrinterOutput({
  width = '100%',
  height = 44,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const tokens = useTokens();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const frameId = `${uid}pf`;
  const rollerId = `${uid}pr`;
  const frame = tokens.color.printer.frame;
  const frame2 = tokens.color.printer['frame-2'];
  const cavity = tokens.color.printer.cavity;
  const roller = tokens.color.printer.roller;
  const highlight = tokens.color.printer.highlight;

  return (
    <View pointerEvents="none" style={[styles.container, { width, height }, style]}>
      <View style={[styles.frame, { backgroundColor: frame, shadowColor: cavity }]}>
        <Svg pointerEvents="none" width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={frameId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={frame} />
              <Stop offset="0.18" stopColor={frame} />
              <Stop offset="0.72" stopColor={frame2} />
              <Stop offset="1" stopColor={frame} />
            </LinearGradient>
          </Defs>
          <Rect
            x="0.5"
            y="0.5"
            width="99%"
            height="98%"
            rx="12"
            fill={`url(#${frameId})`}
            stroke={highlight}
            strokeWidth="1"
          />
        </Svg>

        {/* Reflejo superior */}
        <View style={[styles.topHighlight, { backgroundColor: highlight }]} />

        {/* Cavidad de salida */}
        <View style={[styles.slotOuter, { backgroundColor: frame2, borderColor: frame2 }]}>
          <View style={[styles.slotInner, { backgroundColor: cavity }]}>
            {/* Rodillo interior */}
            <View style={styles.roller}>
              <Svg pointerEvents="none" width="100%" height="100%">
                <Defs>
                  <LinearGradient id={rollerId} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={frame2} />
                    <Stop offset="0.55" stopColor={roller} />
                    <Stop offset="1" stopColor={frame2} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" rx="4" fill={`url(#${rollerId})`} />
              </Svg>
            </View>

            {/* Borde inferior de la ranura */}
            <View style={[styles.slotBottomEdge, { backgroundColor: highlight }]} />
          </View>
        </View>

        {/* Borde frontal inferior */}
        <View style={[styles.bottomHighlight, { backgroundColor: highlight }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center', justifyContent: 'center', overflow: 'visible' },
  frame: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 7,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  topHighlight: {
    position: 'absolute',
    top: 1,
    left: 12,
    right: 12,
    height: 1,
    borderRadius: 1,
    opacity: 0.13,
  },
  slotOuter: { flex: 1, borderRadius: 6, padding: 1, borderWidth: 1, overflow: 'hidden' },
  slotInner: { flex: 1, borderRadius: 4, overflow: 'hidden', justifyContent: 'space-between' },
  roller: {
    height: 5,
    marginHorizontal: 2,
    marginTop: 1,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    overflow: 'hidden',
  },
  slotBottomEdge: { height: 1, marginHorizontal: 3, marginBottom: 1, opacity: 0.1 },
  bottomHighlight: {
    position: 'absolute',
    bottom: 1,
    left: 13,
    right: 13,
    height: 1,
    opacity: 0.06,
  },
});
