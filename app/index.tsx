import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useSessionStore } from '@/stores/session.store';
import { useTokens } from '@/theme/theme-provider';

/** Cold start: wait for the session restore, then land on feed or welcome. */
export default function Index() {
  const tokens = useTokens();
  const status = useSessionStore((s) => s.status);

  if (status === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: tokens.color.bg.canvas }]}>
        <ActivityIndicator color={tokens.color.action.primary.bg} />
      </View>
    );
  }

  return <Redirect href={status === 'authenticated' ? '/(tabs)/feed' : '/(auth)/welcome'} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
