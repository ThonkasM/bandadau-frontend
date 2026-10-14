import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTokens } from '@/theme/theme-provider';

/** Auth/marketing scaffold: centered column with a max width on wide screens. */
export function AuthScaffold({ children }: { children: ReactNode }) {
  const tokens = useTokens();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.color.bg.canvas }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.column}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  column: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: 18 },
});
