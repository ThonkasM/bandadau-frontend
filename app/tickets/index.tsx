import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { FeedList } from '@/components/ui/feed-list';
import { useMyTickets } from '@/features/tickets/api';
import { TicketPass } from '@/features/tickets/components/ticket-pass';
import type { Ticket } from '@/features/tickets/types';
import { useTokens } from '@/theme/theme-provider';

type Tab = 'available' | 'used';

/** UC-12 · My tickets: available vs used, Eventbrite-style ticket cards. */
export default function TicketsScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('tickets');
  const { t: ta } = useTranslation('app');
  const router = useRouter();
  const list = useMyTickets();
  const [tab, setTab] = useState<Tab>('available');

  const items = list.items.filter((ticket) =>
    tab === 'available' ? ticket.status === 'ISSUED' : ticket.status !== 'ISSUED',
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: 'available', label: t('tabs.available') },
    { id: 'used', label: t('tabs.used') },
  ];

  return (
    <Screen title={t('title')} showBack>
      <Button
        label={t('scan')}
        icon="qrcode-scan"
        variant="secondary"
        onPress={() => router.push('/scan')}
      />

      <View style={[styles.tabs, { borderBottomColor: tokens.color.border.default }]}>
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              accessibilityRole="button"
              style={styles.tab}>
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? tokens.color.text.primary : tokens.color.text.muted },
                ]}>
                {item.label}
              </Text>
              {active ? (
                <View style={[styles.tabUnderline, { backgroundColor: tokens.color.brand.accent }]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {list.loading ? (
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      ) : list.error ? (
        <>
          <Text style={[styles.message, { color: tokens.color.text.muted }]}>{t('error')}</Text>
          <Pressable
            onPress={list.refetch}
            style={[styles.retry, { backgroundColor: tokens.color.action.primary.bg }]}>
            <Text style={{ color: tokens.color.action.primary.fg }}>{ta('retry')}</Text>
          </Pressable>
        </>
      ) : (
        <FeedList<Ticket>
          style={styles.list}
          data={items}
          renderItem={({ item }) => (
            <TicketPass
              ticket={item}
              style={styles.ticket}
              onPress={() => router.push(`/tickets/${item.id}`)}
            />
          )}
          keyExtractor={(item) => item.id}
          hasMore={list.hasMore}
          loadingMore={list.loadingMore}
          refreshing={list.refreshing}
          onEndReached={list.loadMore}
          onRefresh={list.refresh}
          renderEmpty={() => (
            <Text style={[styles.message, { color: tokens.color.text.muted }]}>
              {tab === 'available' ? t('empty') : t('emptyUsed')}
            </Text>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', marginTop: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 14.5, fontWeight: '700' },
  tabUnderline: { position: 'absolute', bottom: 0, height: 3, width: '46%', borderRadius: 2 },
  list: { flex: 1, marginTop: 12 },
  ticket: { marginBottom: 16 },
  center: { marginTop: 24 },
  message: { fontSize: 15, marginTop: 16, textAlign: 'center' },
  retry: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
});
