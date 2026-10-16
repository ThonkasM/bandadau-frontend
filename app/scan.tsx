import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/screens/app-header';
import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { useValidateTicket } from '@/features/tickets/api';
import { ApiError } from '@/lib/api-error';
import { useTokens } from '@/theme/theme-provider';

interface Outcome {
  ok: boolean;
  label: string;
}

/** UC-14 · Ticket scanner (camera + QR → `validateTicket`, ORGANIZER only). */
export default function ScanScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('scan');
  const [permission, requestPermission] = useCameraPermissions();
  const validate = useValidateTicket();
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const reasonFor = (error: ApiError): string => {
    switch (error.code) {
      case 'TICKET_ALREADY_USED':
        return t('alreadyUsed');
      case 'TICKET_VOIDED':
        return t('voided');
      case 'INVALID_QR_SIGNATURE':
        return t('invalidSignature');
      case 'TICKET_EVENT_MISMATCH':
        return t('eventMismatch');
      case 'NOT_EVENT_ORGANIZER':
        return t('notOrganizer');
      case 'TICKET_NOT_FOUND':
        return t('notFound');
      case 'VALIDATION_WINDOW_CLOSED':
        return t('windowClosed');
      default:
        return t('error');
    }
  };

  const onScan = ({ data }: { data: string }) => {
    if (outcome || validate.isPending) return;
    validate.mutate(
      { qrPayload: data },
      {
        onSuccess: () => setOutcome({ ok: true, label: t('valid') }),
        onError: (error) =>
          setOutcome({ ok: false, label: error instanceof ApiError ? reasonFor(error) : t('error') }),
      },
    );
  };

  const resultColor = outcome?.ok ? tokens.color.feedback.success.fg : tokens.color.feedback.danger.fg;

  return (
    <Screen padded={false}>
      <AppHeader title={t('title')} />

      {!permission ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.color.action.primary.bg} />
        </View>
      ) : !permission.granted ? (
        <View style={styles.center}>
          <Text style={[styles.hint, { color: tokens.color.text.muted }]}>
            {t('permissionMessage')}
          </Text>
          <Button label={t('grant')} icon="camera" onPress={requestPermission} />
        </View>
      ) : (
        <View style={styles.area}>
          <View style={[styles.viewport, { backgroundColor: tokens.color.bg.muted }]}>
            {outcome ? (
              <MaterialCommunityIcons
                name={outcome.ok ? 'check-circle-outline' : 'alert-circle-outline'}
                size={120}
                color={resultColor}
              />
            ) : (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={onScan}
              />
            )}
            <View style={[styles.corner, styles.tl, { borderColor: tokens.color.brand.accent }]} />
            <View style={[styles.corner, styles.tr, { borderColor: tokens.color.brand.accent }]} />
            <View style={[styles.corner, styles.bl, { borderColor: tokens.color.brand.accent }]} />
            <View style={[styles.corner, styles.br, { borderColor: tokens.color.brand.accent }]} />
          </View>

          {outcome ? (
            <>
              <View
                style={[
                  styles.result,
                  {
                    backgroundColor: tokens.color.bg.surface,
                    borderColor: tokens.color.border.default,
                  },
                ]}>
                <Text style={[styles.resultText, { color: resultColor }]}>{outcome.label}</Text>
              </View>
              <View style={styles.buttonWrap}>
                <Button label={t('scanAgain')} icon="qrcode-scan" onPress={() => setOutcome(null)} />
              </View>
            </>
          ) : (
            <Text style={[styles.hint, { color: tokens.color.text.muted }]}>
              {validate.isPending ? t('validating') : t('hint')}
            </Text>
          )}
        </View>
      )}
    </Screen>
  );
}

const CORNER = 34;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  area: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18 },
  viewport: {
    width: 260,
    height: 260,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  corner: { position: 'absolute', width: CORNER, height: CORNER },
  tl: { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  tr: { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  bl: { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  br: { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  hint: { fontSize: 14, textAlign: 'center', maxWidth: 280 },
  result: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultText: { fontSize: 14.5, fontWeight: '700', textAlign: 'center' },
  buttonWrap: { width: '100%', maxWidth: 320 },
});
