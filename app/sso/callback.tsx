import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { exchangeHandoffCode, parseHandoffCallback } from '@/auth/handoff';
import { Screen } from '@/components/screens/screen';

/** UC-03 panel → app: exchange the handoff code and open the feed. */
export default function SsoCallbackScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const run = async () => {
      const url =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.href
          : ((await Linking.getInitialURL()) ?? '');

      const { code, verifier } = parseHandoffCallback(url);
      if (!code || !verifier) return;

      try {
        await exchangeHandoffCode(code, verifier);
        router.replace('/(tabs)/feed');
      } catch {
        // Invalid/expired code: fall back to manual login (server response).
      }
    };

    void run();
  }, [router]);

  return <Screen title={t('welcome.title')} subtitle={t('welcome.subtitle')} />;
}
