import { formatCredits, formatNumber, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { FeedList } from '@/components/ui/feed-list';
import { useCreateTopUp, useLedger, useMyWallet, useSimulatePayment } from '@/features/wallet/api';
import { LedgerRow } from '@/features/wallet/components/ledger-row';
import { type LedgerEntry, TOPUP_PACKAGES, type TopUpPackage } from '@/features/wallet/types';
import { newUuid } from '@/lib/ids';
import { useTokens } from '@/theme/theme-provider';

/** UC-15/16 · Wallet: balance, top-up packages, movements (mockup, wired to wallet-service). */
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
        <View style={styles.balanceTop}>
          <MaterialCommunityIcons name="wallet-outline" size={18} color={tokens.color.text.muted} />
          <Text style={{ color: tokens.color.text.muted }}>{t('balance')}</Text>
        </View>
        {wallet.isLoading ? (
          <ActivityIndicator color={tokens.color.action.primary.bg} />
        ) : (
          <Text style={[styles.amount, { color: tokens.color.text.primary }]}>
            {formatCredits(wallet.data?.balanceCredits ?? 0, locale)}
          </Text>
        )}
      </View>

      <Text style={[styles.section, { color: tokens.color.text.muted }]}>{t('packages')}</Text>
      <View style={styles.packages}>
        {TOPUP_PACKAGES.map((option) => {
          const selected = pkg === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => setPkg(option.id)}
              accessibilityRole="button"
              style={[
                styles.packageCard,
                {
                  borderColor: selected ? tokens.color.action.primary.bg : tokens.color.border.default,
                  backgroundColor: selected ? tokens.color.bg.muted : tokens.color.bg.surface,
                },
              ]}>
              <Text style={[styles.packageCredits, { color: tokens.color.text.primary }]}>
                {formatCredits(option.credits, locale)}
              </Text>
              <Text style={[styles.packagePrice, { color: tokens.color.text.muted }]}>
                {formatNumber(option.priceMinor / 100, locale, { style: 'currency', currency: 'BOB' })}
              </Text>
            </Pressable>
          );
        })}
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
          renderEmpty={() => <Text style={{ color: tokens.color.text.muted }}>{t('empty')}</Text>}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balance: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
  balanceTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amount: { fontSize: 30, fontWeight: '900' },
  section: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 16 },
  packages: { flexDirection: 'row', gap: 10, marginTop: 8 },
  packageCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 3,
  },
  packageCredits: { fontSize: 14, fontWeight: '800' },
  packagePrice: { fontSize: 12 },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  list: { flex: 1, marginTop: 6 },
  center: { marginTop: 16 },
});
