import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTokens } from '@/theme/theme-provider';

export type TextVariant = 'display' | 'title' | 'subtitle' | 'body' | 'label' | 'caption' | 'link';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
}

/** Themed text. Only semantic tokens; no literal colors. */
export function Text({ variant = 'body', color, style, ...rest }: TextProps) {
  const tokens = useTokens();

  const variants: Record<TextVariant, RNTextProps['style']> = {
    display: { fontSize: 32, fontWeight: '900', color: tokens.color.text.primary },
    title: { fontSize: 26, fontWeight: '800', color: tokens.color.text.primary },
    subtitle: { fontSize: 16, lineHeight: 23, color: tokens.color.text.secondary },
    body: { fontSize: 15, lineHeight: 21, color: tokens.color.text.primary },
    label: { fontSize: 13, fontWeight: '600', color: tokens.color.text.secondary },
    caption: { fontSize: 12.5, color: tokens.color.text.muted },
    link: { fontSize: 15, fontWeight: '700', color: tokens.color.text.link },
  };

  return <RNText {...rest} style={[variants[variant], color ? { color } : null, style]} />;
}
