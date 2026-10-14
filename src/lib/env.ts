/**
 * Public, build-time environment (EXPO_PUBLIC_* are baked into the bundle).
 * Never put secrets here.
 */
export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://api.bandada.localhost',
  appUrl: process.env.EXPO_PUBLIC_APP_URL ?? 'http://app.bandada.localhost',
  adminUrl: process.env.EXPO_PUBLIC_ADMIN_URL ?? 'http://admin.bandada.localhost',
  defaultLocale: process.env.EXPO_PUBLIC_DEFAULT_LOCALE ?? 'es',
} as const;
