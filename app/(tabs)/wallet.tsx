import { formatCredits, type Locale } from '@bandada/i18n';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { Chip } from '@/components/ui/chip';
import { FeedList } from '@/components/ui/feed-list';
import { useCreateTopUp, useLedger, useMyWallet, useSimulatePayment } from '@/features/wallet/api';
import { LedgerRow } from '@/features/wallet/components/ledger-row';
import { type LedgerEntry, TOPUP_PACKAGES, type TopUpPackage } from '@/features/wallet/types';
import { newUuid } from '@/lib/ids';
import { useTokens } from '@/theme/theme-provider';

/** UC-15/16 · Wallet: balance, top-up, movements (mockup, wired to wallet-service). */
export default function WalletScreen() {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('wallet');
  const locale = i18n.language as Locale;
  const wallet = useMyWallet();
  const ledger = useLedger();
  const createTopUp = useCreateTopUp();
  const simulate = useSimulatePayment();
  const [pkg, setPkg] = useState<TopUpPackage>('CREDITS_50');
  const idempotencyKey = useRef(newUuid());

  const onRecharge = () => {
    createTopUp.mutate(
      { package: pkg, idempotencyKey: idempotencyKey.current },
      {
        onSuccess: (topUp) => {
          idempotencyKey.current = newUuid();
          simulate.mutateAsync(topUp.topUpId).catch(() => undefined);
        },
      },
    );
  };

  return (
    <Screen title={t('title')}>
      <View
        style={[
          styles.balance,
          { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
        ]}>
        <Text style={{ color: tokens.color.text.muted }}>{t('balance')}</Text>
        {wallet.isLoading ? (
          <ActivityIndicator color={tokens.color.action.primary.bg} />
        ) : (
          <Text style={[styles.amount, { color: tokens.color.text.primary }]}>
            {formatCredits(wallet.data?.balanceCredits ?? 0, locale)}
          </Text>
        )}
      </View>

      <View style={styles.packages}>
        {TOPUP_PACKAGES.map((option) => (
          <Chip
            key={option.id}
            label={formatCredits(option.credits, locale)}
            selected={pkg === option.id}
            onPress={() => setPkg(option.id)}
          />
        ))}
      </View>
      <Pressable
        onPress={onRecharge}
        style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
        <Text style={{ color: tokens.color.action.primary.fg }}>{t('recharge')}</Text>
      </Pressable>

      <Text style={[styles.section, { color: tokens.color.text.muted }]}>{t('movements')}</Text>
      {ledger.loading ? (
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      ) : (
        <FeedList<LedgerEntry>
          style={styles.list}
          data={ledger.items}
          renderItem={({ item }) => <LedgerRow entry={item} />}
          keyExtractor={(item) => item.id}
          hasMore={ledger.hasMore}
          loadingMore={ledger.loadingMore}
          refreshing={ledger.refreshing}
          onEndReached={ledger.loadMore}
          onRefresh={ledger.refresh}
          renderEmpty={() => (
            <Text style={{ color: tokens.color.text.muted }}>{t('empty')}</Text>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balance: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 4 },
  amount: { fontSize: 28, fontWeight: '900' },
  packages: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  section: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 18 },
  list: { flex: 1, marginTop: 6 },
  center: { marginTop: 16 },
});
