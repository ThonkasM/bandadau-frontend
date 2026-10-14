import { StyleSheet, View } from 'react-native';

import { BandadaMark, BandadaWordmark, BRAND } from '@/components/brand/BandadaLogo';
import { Text } from '@/components/ui/text';
import { useTheme, useTokens } from '@/theme/theme-provider';
import { useBrand } from '@/theme/use-brand';

export interface BrandHeroProps {
  height?: number;
  subtitle?: string;
}

/**
 * Brand hero: dark brand block (azul río in light, azul noche in dark) with the
 * logo inverted to white + paraba-yellow accent, mirroring the splash.
 */
export function BrandHero({ height = 240, subtitle }: BrandHeroProps) {
  const { effective } = useTheme();
  const tokens = useTokens();
  const brand = useBrand();
  const background =
    effective === 'dark' ? tokens.color.bg['surface-raised'] : tokens.color.brand.primary;

  return (
    <View style={[styles.hero, { backgroundColor: background, height }]}>
      <BandadaMark size={92} color={BRAND.white} accent={brand.accent} />
      <BandadaWordmark width={168} color={BRAND.white} accent={brand.accent} />
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
    padding: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  subtitle: { opacity: 0.85, textAlign: 'center' },
});
