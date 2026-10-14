/**
 * Public, build-time environment (EXPO_PUBLIC_* are baked into the bundle).
 * Never put secrets here.
 */

// Mocks (local fixtures): on by default in dev, unless explicitly disabled.
// `EXPO_PUBLIC_USE_MOCKS=true` forces them; `=false` disables them.
const mocksFlag = process.env.EXPO_PUBLIC_USE_MOCKS;
const useMocks = mocksFlag === 'true' || (mocksFlag === undefined && __DEV__);

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://api.bandada.localhost',
  appUrl: process.env.EXPO_PUBLIC_APP_URL ?? 'http://app.bandada.localhost',
  adminUrl: process.env.EXPO_PUBLIC_ADMIN_URL ?? 'http://admin.bandada.localhost',
  defaultLocale: process.env.EXPO_PUBLIC_DEFAULT_LOCALE ?? 'es',
  /** Serve local fixtures when the backend service is not available (Fase 1). */
  useMocks,
} as const;
