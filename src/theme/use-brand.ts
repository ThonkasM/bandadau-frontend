import { useTheme, useTokens } from '@/theme/theme-provider';

/**
 * Brand colors for the logo/lockups: brand blue on light, **inverted to white**
 * on dark, always keeping the paraba-yellow accent.
 */
export function useBrand(): { color: string; accent: string } {
  const { effective } = useTheme();
  const tokens = useTokens();
  const dark = effective === 'dark';
  return {
    color: dark ? tokens.color.text.primary : tokens.color.brand.primary,
    accent: tokens.color.brand.accent,
  };
}
