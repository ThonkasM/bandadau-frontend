import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { restoreSession } from '@/auth/session';
import { BandadaLoader } from '@/components/brand/BandadaLogo';
import { useSessionStore } from '@/stores/session.store';
import { useTokens } from '@/theme/theme-provider';

/**
 * Cold-start gate: restores the session (native: stored refresh token; web:
 * HttpOnly cookie) and then routes to the feed or the welcome screen.
 */
export default function Index() {
  const tokens = useTokens();
  const status = useSessionStore((s) => s.status);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    restoreSession().finally(() => setBooted(true));
  }, []);

  if (!booted) {
    return (
      <View style={[styles.splash, { backgroundColor: tokens.color.bg.canvas }]}>
        <BandadaLoader
          size={72}
          color={tokens.color.brand.primary}
          accent={tokens.color.brand.accent}
        />
      </View>
    );
  }

  return status === 'authenticated' ? (
    <Redirect href="/(tabs)/feed" />
  ) : (
    <Redirect href="/(auth)/welcome" />
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
