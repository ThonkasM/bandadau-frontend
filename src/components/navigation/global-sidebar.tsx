import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { usePathname, useRouter } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BandadaMark, BandadaWordmark } from '@/components/brand/BandadaLogo';
import {
  isNavRouteActive,
  type NavRoute,
  sidebarRoutes,
} from '@/config/navigation';
import { SIDEBAR_WIDTH } from '@/constants/layout';
import { useTokens } from '@/theme/theme-provider';
import { useBrand } from '@/theme/use-brand';

type ThemeTokens = ReturnType<typeof useTokens>;
type Styles = ReturnType<typeof createStyles>;

const ICON_SIZE = 22;

interface SidebarItemProps {
  route: NavRoute;
  label: string;
  active: boolean;
  tokens: ThemeTokens;
  styles: Styles;
  onNavigate: (href: string) => void;
}

const SidebarItem = memo(function SidebarItem({
  route,
  label,
  active,
  tokens,
  styles,
  onNavigate,
}: SidebarItemProps) {
  return (
    <Pressable
      role="link"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onPress={() => onNavigate(route.href)}
      style={[styles.item, active && styles.itemActive]}>
      <View
        style={[
          styles.indicator,
          active && { backgroundColor: tokens.color.action.primary.bg },
        ]}
      />
      <MaterialCommunityIcons
        name={active ? route.iconActive : route.icon}
        size={ICON_SIZE}
        color={active ? tokens.color.text.primary : tokens.color.text.muted}
      />
      <Text numberOfLines={1} style={[styles.itemText, active && styles.itemTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
});

/** Global web sidebar (≥ 1024px). Tokens only; no raw palette (D13). */
export default function GlobalSidebar() {
  const tokens = useTokens();
  const brand = useBrand();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation('nav');
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const onNavigate = useCallback((href: string) => router.navigate(href as never), [router]);

  if (Platform.OS !== 'web') return null;

  return (
    <View role="navigation" aria-label={t('menu')} style={styles.sidebar}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <BandadaMark size={28} color={brand.color} accent={brand.accent} />
          <BandadaWordmark width={116} color={brand.color} accent={brand.accent} />
        </View>
      </View>
      <View style={styles.nav}>
        {sidebarRoutes().map((route) => (
          <SidebarItem
            key={route.name}
            route={route}
            label={t(route.labelKey)}
            active={isNavRouteActive(pathname, route)}
            tokens={tokens}
            styles={styles}
            onNavigate={onNavigate}
          />
        ))}
      </View>
    </View>
  );
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    sidebar: {
      width: SIDEBAR_WIDTH,
      backgroundColor: tokens.color.bg.surface,
      borderRightWidth: 1,
      borderRightColor: tokens.color.border.default,
      ...Platform.select({
        web: {
          position: 'fixed' as 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
        },
      }),
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 20,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    nav: { flex: 1, paddingHorizontal: 12, gap: 4 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      height: 44,
      paddingRight: 14,
      borderRadius: 12,
      overflow: 'hidden',
    },
    itemActive: { backgroundColor: tokens.color.bg.muted },
    indicator: { width: 3, height: 20, borderRadius: 2, backgroundColor: 'transparent' },
    itemText: { flex: 1, fontSize: 14.5, fontWeight: '600', color: tokens.color.text.muted },
    itemTextActive: { color: tokens.color.text.primary },
  });
