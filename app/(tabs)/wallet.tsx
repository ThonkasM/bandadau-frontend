import { formatCredits, formatNumber, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { PaymentModal, type PaymentPhase } from '@/components/ui/payment-modal';
import { VirtualList } from '@/components/ui/virtual-list';
import { useCreateTopUp, useLedger, useMyWallet, useSimulatePayment } from '@/features/wallet/api';
import { LedgerRow } from '@/features/wallet/components/ledger-row';
import { BalanceSkeleton, MovementsSkeleton } from '@/features/wallet/components/wallet-skeleton';
import { type LedgerEntry, TOPUP_PACKAGES, type TopUpPackage } from '@/features/wallet/types';
import { newUuid } from '@/lib/ids';
import { useTokens } from '@/theme/theme-provider';

const MIN_PROCESSING_MS = 1900;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Smallest package that covers the (possibly zero) missing credits. */
function minPackageFor(needed: number): TopUpPackage {
  return TOPUP_PACKAGES.find((option) => option.credits >= needed)?.id ?? 'CREDITS_100';
}

/** UC-15/16 · Wallet: balance, top-up packages, movements (mockup, wired to wallet-service). */
export default function WalletScreen() {
  const tokens = useTokens();
  const router = useRouter();
  const { t, i18n } = useTranslation('wallet');
  const locale = i18n.language as Locale;
  // UC-12 «extend»: when arriving from an event (saldo insuficiente) we pre-select
  // the minimum package and return to the event once the top-up is done.
  const { returnTo, needed } = useLocalSearchParams<{ returnTo?: string; needed?: string }>();
  const neededCredits = Number(needed ?? 0);
  const wallet = useMyWallet();
  const ledger = useLedger();
  const createTopUp = useCreateTopUp();
  const simulate = useSimulatePayment();
  const [selectedPkg, setSelectedPkg] = useState<TopUpPackage | null>(null);
  const [payPhase, setPayPhase] = useState<PaymentPhase>('processing');
  const [payVisible, setPayVisible] = useState(false);
  const idempotencyKey = useRef(newUuid());

  // Arriving from an event pre-selects the minimum package; otherwise the default.
  const pkg = selectedPkg ?? (returnTo ? minPackageFor(neededCredits) : 'CREDITS_50');
  const selectedCredits = TOPUP_PACKAGES.find((option) => option.id === pkg)?.credits ?? 0;

  // `fresh` = new intent (regenerate the key); a retry reuses the same key.
  const onRecharge = async (fresh = false) => {
    if (fresh) idempotencyKey.current = newUuid();
    setPayPhase('processing');
    setPayVisible(true);
    const started = Date.now();
    const settle = () => wait(Math.max(0, MIN_PROCESSING_MS - (Date.now() - started)));
    try {
      const topUp = await createTopUp.mutateAsync({
        package: pkg,
        idempotencyKey: idempotencyKey.current,
      });
      await simulate.mutateAsync(topUp.topUpId);
      await settle();
      setPayPhase('confirmed');
    } catch {
      await settle();
      setPayPhase('failed');
    }
  };

  // After a successful top-up return to the originating event (UC-12 alterno 13a).
  const finishTopUp = () => {
    setPayVisible(false);
    if (returnTo) router.push(`/events/${returnTo}`);
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
          <BalanceSkeleton />
        ) : (
          <Text style={[styles.amount, { color: tokens.color.text.primary }]}>
            {formatCredits(wallet.data?.balanceCredits ?? 0, locale)}
          </Text>
        )}
      </View>

      {returnTo ? (
        <View
          style={[
            styles.returnNote,
            {
              backgroundColor: tokens.color.feedback.info.bg,
              borderColor: tokens.color.feedback.info.border,
            },
          ]}>
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={tokens.color.feedback.info.fg}
          />
          <Text style={[styles.returnNoteText, { color: tokens.color.feedback.info.fg }]}>
            {t('returnToEvent')}
          </Text>
        </View>
      ) : null}

      <Text style={[styles.section, { color: tokens.color.text.muted }]}>{t('packages')}</Text>
      <View style={styles.packages}>
        {TOPUP_PACKAGES.map((option) => {
          const selected = pkg === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => setSelectedPkg(option.id)}
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
        onPress={() => onRecharge(true)}
        style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
        <Text style={{ color: tokens.color.action.primary.fg }}>{t('recharge')}</Text>
      </Pressable>

      <Text style={[styles.section, { color: tokens.color.text.muted }]}>{t('movements')}</Text>
      {ledger.loading ? (
        <MovementsSkeleton />
      ) : (
        <VirtualList<LedgerEntry>
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

      <PaymentModal
        visible={payVisible}
        phase={payPhase}
        onClose={() => setPayVisible(false)}
        copy={{
          processing: {
            title: t('topup.processingTitle'),
            subtitle: t('topup.charging', { count: selectedCredits }),
            steps: [t('topup.step1'), t('topup.step2'), t('topup.step3')],
            note: t('topup.dontClose'),
          },
          confirmed: {
            title: t('topup.confirmedTitle'),
            subtitle: t('topup.confirmedSubtitle', { count: selectedCredits }),
            primaryLabel: t('topup.done'),
            onPrimary: finishTopUp,
          },
          failed: {
            title: t('topup.failedTitle'),
            message: t('topup.failedMessage'),
            primaryLabel: t('topup.retry'),
            onPrimary: () => onRecharge(),
            secondaryLabel: t('topup.close'),
          },
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  balance: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
  balanceTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amount: { fontSize: 30, fontWeight: '900', lineHeight: 38 },
  returnNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  returnNoteText: { fontSize: 13, flex: 1 },
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
});
