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
  icon: './assets/brand/icon-1024.png',
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.bandadau.app',
    associatedDomains: [`applinks:app.${BASE_DOMAIN}`],
    icon: {
      light: './assets/brand/icon-1024.png',
      dark: './assets/brand/icon-1024-dark.png',
      tinted: './assets/brand/icon-1024-tinted.png',
    },
  },
  android: {
    package: 'com.bandadau.app',
    adaptiveIcon: {
      foregroundImage: './assets/brand/android-adaptive-foreground.png',
      monochromeImage: './assets/brand/android-adaptive-monochrome.png',
      backgroundColor: '#1238A8',
    },
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
    favicon: './assets/brand/favicon.png',
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
        image: './assets/brand/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#0A1F66',
        dark: { backgroundColor: '#0A1F66' },
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/brand/notification-icon.png',
        color: '#1238A8',
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
