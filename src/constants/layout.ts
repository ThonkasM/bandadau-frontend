/** Single source of truth for layout metrics (feeds, headers, sidebar). */
export const GUTTER_MOBILE = 16;
export const GUTTER_DESKTOP = 24;

export const RADIUS = {
  controlSm: 12,
  control: 14,
  card: 16,
  cardLg: 20,
  sheet: 24,
} as const;

/** Width of the global web sidebar. Shared by the hook, root layout and sidebar. */
export const SIDEBAR_WIDTH = 248;

/** Below this width the floating tabs replace the web sidebar. */
export const SIDEBAR_BREAKPOINT = 1024;

/** Minimum touch target (a11y) for icon-only controls, in points. */
export const TOUCH_TARGET = 44;
