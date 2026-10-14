import { StyleSheet, View } from 'react-native';

import { BandadaMark, BandadaWordmark, BRAND } from '@/components/brand/BandadaLogo';
import { Text } from '@/components/ui/text';
import { useTheme, useTokens } from '@/theme/theme-provider';
import { useBrand } from '@/theme/use-brand';

export interface BrandHeroProps {
  /** Content height, EXCLUDING the safe-area inset (the hero grows by `paddingTop`). */
  height?: number;
  subtitle?: string;
  /** Top safe-area inset so the logo clears the notch / Dynamic Island. */
  paddingTop?: number;
}

/**
 * Brand hero: dark brand block (azul río in light, azul noche in dark) with the
 * logo inverted to white + paraba-yellow accent, mirroring the splash.
 */
export function BrandHero({ height = 240, subtitle, paddingTop = 0 }: BrandHeroProps) {
  const { effective } = useTheme();
  const tokens = useTokens();
  const brand = useBrand();
  const background =
    effective === 'dark' ? tokens.color.bg['surface-raised'] : tokens.color.brand.primary;

  return (
    <View
      style={[
        styles.hero,
        { backgroundColor: background, minHeight: height + paddingTop, paddingTop },
      ]}
    >
      <BandadaMark size={height < 200 ? 64 : 88} color={BRAND.white} accent={brand.accent} />
      <BandadaWordmark width={160} color={BRAND.white} accent={brand.accent} />
      {subtitle ? (
        <Text variant="caption" color={BRAND.white} style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  subtitle: { opacity: 0.85, textAlign: 'center' },
});
