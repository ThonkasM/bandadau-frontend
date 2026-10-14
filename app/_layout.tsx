import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import GlobalSidebar from '@/components/navigation/global-sidebar';
import { SIDEBAR_WIDTH } from '@/constants/layout';
import { useSidebarLayout } from '@/hooks/use-sidebar-layout';
import { initI18n } from '@/i18n';
import { queryClient } from '@/lib/query-client';
import { ThemeProvider, useTheme, useTokens } from '@/theme/theme-provider';

function RootLayoutInner() {
  const { effective } = useTheme();
  const { hasSidebar } = useSidebarLayout();
  const isDark = effective === 'dark';

  return (
    <>
      <View style={styles.container}>
        {hasSidebar && <GlobalSidebar />}
        <View
          style={[
            styles.content,
            hasSidebar && Platform.OS === 'web' ? { marginLeft: SIDEBAR_WIDTH } : null,
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

  useEffect(() => {
    initI18n().finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ThemedRoot />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1 },
  container: { flex: 1, flexDirection: 'row' },
  content: { flex: 1 },
});
