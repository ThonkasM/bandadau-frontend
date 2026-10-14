import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { useTokens } from '@/theme/theme-provider';

type ScanResult = 'valid' | 'used' | 'invalid';

const CYCLE: ScanResult[] = ['valid', 'used', 'invalid'];

/** UC-14 · Ticket scanner (mockup: camera frame + simulated result). */
export default function ScanScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('scan');
  const [result, setResult] = useState<ScanResult | null>(null);

  const simulate = () => {
    const next = result ? CYCLE[(CYCLE.indexOf(result) + 1) % CYCLE.length]! : CYCLE[0]!;
    setResult(next);
  };

  const resultColor =
    result === 'valid'
      ? tokens.color.feedback.success.fg
      : result === 'invalid'
        ? tokens.color.feedback.danger.fg
        : tokens.color.text.muted;

  return (
    <Screen padded={false}>
      <View style={styles.area}>
        <View style={[styles.viewport, { backgroundColor: tokens.color.bg.muted }]}>
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={140}
            color={tokens.color.brand.primary}
          />
          <View style={[styles.corner, styles.tl, { borderColor: tokens.color.brand.accent }]} />
          <View style={[styles.corner, styles.tr, { borderColor: tokens.color.brand.accent }]} />
          <View style={[styles.corner, styles.bl, { borderColor: tokens.color.brand.accent }]} />
          <View style={[styles.corner, styles.br, { borderColor: tokens.color.brand.accent }]} />
        </View>

        <Text style={[styles.hint, { color: tokens.color.text.muted }]}>{t('hint')}</Text>

        {result ? (
          <View
            style={[
              styles.result,
              {
                backgroundColor: tokens.color.bg.surface,
                borderColor: tokens.color.border.default,
              },
            ]}>
            <MaterialCommunityIcons
              name={result === 'valid' ? 'check-circle-outline' : 'alert-circle-outline'}
              size={26}
              color={resultColor}
            />
            <Text style={[styles.resultText, { color: resultColor }]}>{t(result)}</Text>
          </View>
        ) : null}

        <View style={styles.buttonWrap}>
          <Button
            label={result ? t('scanAgain') : t('simulate')}
            icon="qrcode-scan"
            onPress={simulate}
          />
        </View>
      </View>
    </Screen>
  );
}

const CORNER = 34;

const styles = StyleSheet.create({
  area: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18 },
  viewport: {
    width: 260,
    height: 260,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: { position: 'absolute', width: CORNER, height: CORNER },
  tl: { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  tr: { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  bl: { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  br: { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  hint: { fontSize: 14, textAlign: 'center', maxWidth: 280 },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultText: { fontSize: 14.5, fontWeight: '700' },
  buttonWrap: { width: '100%', maxWidth: 320 },
});
