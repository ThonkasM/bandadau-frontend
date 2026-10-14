import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/screens/screen';

export default function NotificationsScreen() {
  const { t } = useTranslation('nav');
  return <Screen title={t('notifications')} />;
}
