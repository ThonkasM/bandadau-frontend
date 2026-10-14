import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { restoreSession } from '@/auth/session';
import { BandadaLoader } from '@/components/brand/BandadaLogo';
import { useTokens } from '@/theme/theme-provider';
import { useBrand } from '@/theme/use-brand';

/**
 * Cold start always lands on **Welcome**. The session is restored in the
 * background (native: stored refresh; web: HttpOnly cookie); entering via
 * login/register/guest navigates to the feed.
 */
export default function Index() {
  const tokens = useTokens();
  const brand = useBrand();
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    restoreSession().finally(() => setBooted(true));
  }, []);

  if (!booted) {
    return (
      <View style={[styles.splash, { backgroundColor: tokens.color.bg.canvas }]}>
        <BandadaLoader size={72} color={brand.color} accent={brand.accent} />
      </View>
    );
  }

  return <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
