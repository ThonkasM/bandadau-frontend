import { Platform, type ViewStyle } from 'react-native';

export interface ShadowLayer {
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
}

/**
 * Converts a semantic shadow scale (e.g. `tokens.shadow.md`) into a platform style,
 * so components never hardcode a shadow color (B-8).
 */
export function shadowStyle(shadow: readonly ShadowLayer[]): ViewStyle {
  const [layer] = shadow;
  if (!layer) return {};
  const boxShadow = `${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${layer.spread}px ${layer.color}`;
  return Platform.select<ViewStyle>({
    web: { boxShadow } as ViewStyle,
    ios: {
      shadowColor: layer.color,
      shadowOffset: { width: layer.offsetX, height: layer.offsetY },
      shadowOpacity: 1,
      shadowRadius: layer.blur,
    },
    android: { elevation: Math.round(layer.offsetY / 2) },
    default: {},
  }) as ViewStyle;
}
