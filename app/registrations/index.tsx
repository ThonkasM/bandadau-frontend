import { formatDate, type Locale } from '@bandada/i18n';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { FeedList } from '@/components/ui/feed-list';
import { useMyRegistrations } from '@/features/events/api';
import type { Registration } from '@/features/events/types';
import { useTokens } from '@/theme/theme-provider';

/** UC-12/13 · My registrations (SAGA state). */
export default function RegistrationsScreen() {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('events');
  const locale = i18n.language as Locale;
  const router = useRouter();
  const list = useMyRegistrations();

  return (
    <Screen title={t('registrations.title')} showBack>
      {list.loading ? (
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      ) : (
        <FeedList<Registration>
          data={list.items}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/registrations/${item.id}`)}
              accessibilityRole="button"
              style={[
                styles.row,
                { borderColor: tokens.color.border.default, backgroundColor: tokens.color.bg.surface },
              ]}>
              <Text style={[styles.title, { color: tokens.color.text.primary }]} numberOfLines={1}>
                {item.event?.title ?? ''}
              </Text>
              <Text style={[styles.meta, { color: tokens.color.text.muted }]}>
                {t(`registrations.status.${item.status}`)}
                {item.event?.startsAt ? ` · ${formatDate(item.event.startsAt, locale)}` : ''}
              </Text>
            </Pressable>
          )}
          keyExtractor={(item) => item.id}
          renderEmpty={() => (
            <Text style={[styles.empty, { color: tokens.color.text.muted }]}>
              {t('registrations.empty')}
            </Text>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { marginTop: 24 },
  row: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10, gap: 4 },
  title: { fontSize: 15.5, fontWeight: '800' },
  meta: { fontSize: 13 },
  empty: { fontSize: 15, marginTop: 16, textAlign: 'center' },
});
