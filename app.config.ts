import type { ExpoConfig } from 'expo/config';

const BASE_DOMAIN = process.env.EXPO_PUBLIC_BASE_DOMAIN ?? 'bandada.localhost';
const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? `http://app.${BASE_DOMAIN}`;

const config: ExpoConfig = {
  name: 'Bandada U',
  slug: 'bandadau',
  scheme: 'bandadau',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.bandadau.app',
    associatedDomains: [`applinks:app.${BASE_DOMAIN}`],
  },
  android: {
    package: 'com.bandadau.app',
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: `app.${BASE_DOMAIN}`, pathPrefix: '/sso/callback' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: [
    'expo-router',
    'expo-localization',
    'expo-secure-store',
    'expo-system-ui',
    'expo-web-browser',
    [
      'expo-splash-screen',
      {
        resizeMode: 'contain',
        backgroundColor: '#F7F7F5',
        dark: { backgroundColor: '#12110E' },
      },
    ],
  ],
  extra: {
    appUrl: APP_URL,
    adminUrl: process.env.EXPO_PUBLIC_ADMIN_URL ?? `http://admin.${BASE_DOMAIN}`,
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    },
  },
};

export default config;
