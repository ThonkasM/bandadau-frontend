import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface NavRoute {
  name: string;
  /** i18n key in the `nav` namespace. */
  labelKey: string;
  href: string;
  icon: IconName;
  iconActive: IconName;
  /** Path prefixes that mark the route as active (without groups). */
  match: string[];
  /** Show in the bottom tab bar (native + narrow web). */
  inTabBar: boolean;
  /** Show only for MODERATOR/ADMIN. */
  requiresPanel?: boolean;
}

/** Single source of truth for the app navigation (tabs + web sidebar). */
export const NAV_ROUTES: NavRoute[] = [
  {
    name: 'feed',
    labelKey: 'feed',
    href: '/(tabs)/feed',
    icon: 'home-outline',
    iconActive: 'home',
    match: ['/feed', '/posts'],
    inTabBar: true,
  },
  {
    name: 'events',
    labelKey: 'events',
    href: '/(tabs)/events',
    icon: 'calendar-blank-outline',
    iconActive: 'calendar-blank',
    match: ['/events'],
    inTabBar: true,
  },
  {
    name: 'create',
    labelKey: 'create',
    href: '/(tabs)/create',
    icon: 'plus-circle-outline',
    iconActive: 'plus-circle',
    match: ['/create'],
    inTabBar: true,
  },
  {
    name: 'wallet',
    labelKey: 'wallet',
    href: '/(tabs)/wallet',
    icon: 'wallet-outline',
    iconActive: 'wallet',
    match: ['/wallet'],
    inTabBar: true,
  },
  {
    name: 'profile',
    labelKey: 'profile',
    href: '/(tabs)/profile',
    icon: 'account-outline',
    iconActive: 'account',
    match: ['/profile', '/settings'],
    inTabBar: true,
  },
  {
    name: 'notifications',
    labelKey: 'notifications',
    href: '/notifications',
    icon: 'bell-outline',
    iconActive: 'bell',
    match: ['/notifications'],
    inTabBar: false,
  },
  {
    name: 'tickets',
    labelKey: 'tickets',
    href: '/tickets',
    icon: 'ticket-outline',
    iconActive: 'ticket',
    match: ['/tickets'],
    inTabBar: false,
  },
  {
    name: 'groups',
    labelKey: 'groups',
    href: '/groups',
    icon: 'account-group-outline',
    iconActive: 'account-group',
    match: ['/groups'],
    inTabBar: false,
  },
  {
    name: 'settings',
    labelKey: 'settings',
    href: '/settings',
    icon: 'cog-outline',
    iconActive: 'cog',
    match: ['/settings'],
    inTabBar: false,
  },
];

export function isNavRouteActive(pathname: string, route: NavRoute): boolean {
  return route.match.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function tabRoutes(): NavRoute[] {
  return NAV_ROUTES.filter((route) => route.inTabBar);
}

export function sidebarRoutes(): NavRoute[] {
  return NAV_ROUTES;
}
