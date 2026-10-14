import { formatCredits, formatDate, type Locale } from '@bandada/i18n';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { LedgerEntry } from '@/features/wallet/types';
import { useTokens } from '@/theme/theme-provider';

export function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const tokens = useTokens();
  const { i18n } = useTranslation();
  const { t } = useTranslation('wallet');
  const locale = i18n.language as Locale;

  const incoming = entry.type !== 'DEBIT';
  const sign = incoming ? '+' : '-';
  const amountColor = incoming ? tokens.color.feedback.success.fg : tokens.color.text.primary;

  return (
    <View style={[styles.row, { borderColor: tokens.color.border.default }]}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: tokens.color.text.primary }]}>
          {entry.description ?? t(`type.${entry.type}`)}
        </Text>
        <Text style={[styles.date, { color: tokens.color.text.muted }]}>
          {formatDate(entry.createdAt, locale)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {sign}
        {formatCredits(entry.amountCredits, locale)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: { flex: 1, gap: 2, paddingRight: 12 },
  title: { fontSize: 14.5, fontWeight: '600' },
  date: { fontSize: 12 },
  amount: { fontSize: 14.5, fontWeight: '700' },
});
