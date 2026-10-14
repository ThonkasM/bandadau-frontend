import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/screens/screen';

/**
 * UC-03 panel → app callback. Reads `code` (query) and `cv` (fragment) and
 * exchanges the handoff code; the exchange lands in Fase B.
 */
export default function SsoCallbackScreen() {
  const { t } = useTranslation('auth');
  const params = useLocalSearchParams<{ code?: string }>();
  void params;
  return <Screen title={t('welcome.title')} subtitle={t('welcome.subtitle')} />;
}
