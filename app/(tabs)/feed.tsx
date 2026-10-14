import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/screens/screen';

export default function FeedScreen() {
  const { t } = useTranslation('nav');
  return <Screen title={t('feed')} subtitle={t('app:loading')} />;
}
