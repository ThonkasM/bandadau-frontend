import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/screens/screen';

/** UC-01 email verification. Code entry + resend land in Fase B. */
export default function VerifyEmailScreen() {
  const { t } = useTranslation('auth');
  return <Screen title={t('verify.title')} subtitle={t('verify.subtitle', { email: '' })} />;
}
