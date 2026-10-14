// Hermes does not implement `Intl.PluralRules`; i18next and ICU (intl-messageformat)
// need it. This polyfill must run before i18n initializes.
import 'intl-pluralrules';
import '../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BandadaSplash } from '@/components/brand/BandadaLogo';
import GlobalSidebar from '@/components/navigation/global-sidebar';
import { SIDEBAR_WIDTH } from '@/constants/layout';
import { useSidebarLayout } from '@/hooks/use-sidebar-layout';
import { initI18n } from '@/i18n';
import { queryClient } from '@/lib/query-client';
import { ThemeProvider, useTheme, useTokens } from '@/theme/theme-provider';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const AUTH_ROUTES = new Set(['/', '/welcome', '/login', '/register', '/verify-email']);

function RootLayoutInner() {
  const { effective } = useTheme();
  const { hasSidebar } = useSidebarLayout();
  const pathname = usePathname();
  const isDark = effective === 'dark';
  // Auth screens are full-screen on web (no global sidebar).
  const showSidebar = hasSidebar && !AUTH_ROUTES.has(pathname);

  return (
    <>
      <View style={styles.container}>
        {showSidebar && <GlobalSidebar />}
        <View
          style={[
            styles.content,
            showSidebar && Platform.OS === 'web' ? { marginLeft: SIDEBAR_WIDTH } : null,
          ]}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings/index" options={{ presentation: 'modal' }} />
          </Stack>
        </View>
      </View>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

function ThemedRoot() {
  const tokens = useTokens();
  return (
    <View style={[styles.app, { backgroundColor: tokens.color.bg.canvas }]}>
      <RootLayoutInner />
    </View>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    initI18n().finally(() => setReady(true));
  }, []);

  const showSplash = !ready || !splashDone;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.flex}>
        <KeyboardProvider>
          {ready ? (
            <QueryClientProvider client={queryClient}>
              <ThemeProvider>
                <BottomSheetModalProvider>
                  <ThemedRoot />
                </BottomSheetModalProvider>
              </ThemeProvider>
            </QueryClientProvider>
          ) : null}
          {showSplash ? (
            <BandadaSplash
              onLayout={() => SplashScreen.hideAsync().catch(() => undefined)}
              onFinish={() => setSplashDone(true)}
            />
          ) : null}
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  app: { flex: 1 },
  container: { flex: 1, flexDirection: 'row' },
  content: { flex: 1 },
});
