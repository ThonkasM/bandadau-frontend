import { errorMessage, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, useTokens } from '@/theme/theme-provider';

import type { Registration } from '../types';

export type PaymentPhase = 'processing' | 'confirmed' | 'failed';

const STEP_MS = 900;
const STEP_COUNT = 3;

/** Animated reserve → debit → issue checklist (mounts only while processing). */
function PaymentSteps() {
  const tokens = useTokens();
  const { t } = useTranslation('events');
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEP_COUNT - 1)), STEP_MS);
    return () => clearInterval(timer);
  }, []);

  const steps = [t('payment.step1'), t('payment.step2'), t('payment.step3')];

  return (
    <View style={styles.steps}>
      {steps.map((label, i) => (
        <View key={label} style={styles.stepRow}>
          <MaterialCommunityIcons
            name={i < step ? 'check-circle' : i === step ? 'progress-clock' : 'circle-outline'}
            size={18}
            color={i <= step ? tokens.color.action.primary.bg : tokens.color.text.muted}
          />
          <Text
            style={[
              styles.stepLabel,
              { color: i <= step ? tokens.color.text.primary : tokens.color.text.muted },
            ]}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * UC-12: simulated payment/registration SAGA. Shows a loader with the
 * reserve → debit → issue steps while polling the registration, then the
 * outcome (ticket issued or failure reason).
 */
export function PaymentModal({
  visible,
  phase,
  registration,
  onClose,
  onViewTicket,
  onRetry,
}: {
  visible: boolean;
  phase: PaymentPhase;
  registration: Registration | null;
  onClose: () => void;
  onViewTicket: () => void;
  onRetry: () => void;
}) {
  const tokens = useTokens();
  const { effective } = useTheme();
  const { t, i18n } = useTranslation('events');
  const locale = i18n.language as Locale;
  const price = registration?.priceCredits ?? 0;
  const scrim = effective === 'dark' ? tokens.color.bg.canvas : tokens.color.bg.inverse;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: scrim, opacity: 0.5 }]}
          pointerEvents="none"
        />
        <View
          style={[
            styles.card,
            { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
          ]}
        >
          {phase === 'processing' ? (
            <>
              <ActivityIndicator size="large" color={tokens.color.action.primary.bg} />
              <Text style={[styles.title, { color: tokens.color.text.primary }]}>
                {t('payment.processingTitle')}
              </Text>
              {price > 0 ? (
                <Text style={[styles.subtitle, { color: tokens.color.text.muted }]}>
                  {t('payment.debiting', { count: price })}
                </Text>
              ) : null}
              <PaymentSteps />
              <Text style={[styles.hint, { color: tokens.color.text.muted }]}>
                {t('payment.dontClose')}
              </Text>
            </>
          ) : phase === 'confirmed' ? (
            <>
              <MaterialCommunityIcons
                name="check-circle"
                size={56}
                color={tokens.color.feedback.success.fg}
              />
              <Text style={[styles.title, { color: tokens.color.text.primary }]}>
                {t('payment.confirmedTitle')}
              </Text>
              <Text style={[styles.subtitle, { color: tokens.color.text.muted }]}>
                {t('payment.confirmedSubtitle')}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onViewTicket}
                style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}
              >
                <Text style={[styles.buttonLabel, { color: tokens.color.action.primary.fg }]}>
                  {t('payment.viewTicket')}
                </Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.linkBtn}>
                <Text style={[styles.link, { color: tokens.color.text.muted }]}>
                  {t('payment.close')}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <MaterialCommunityIcons
                name="alert-circle"
                size={56}
                color={tokens.color.feedback.danger.fg}
              />
              <Text style={[styles.title, { color: tokens.color.text.primary }]}>
                {t('payment.failedTitle')}
              </Text>
              <Text style={[styles.subtitle, { color: tokens.color.text.muted }]}>
                {errorMessage(registration?.failureReason ?? undefined, locale)}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}
              >
                <Text style={[styles.buttonLabel, { color: tokens.color.action.primary.fg }]}>
                  {t('payment.retry')}
                </Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.linkBtn}>
                <Text style={[styles.link, { color: tokens.color.text.muted }]}>
                  {t('payment.close')}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 12,
    padding: 24,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center' },
  steps: { alignSelf: 'stretch', gap: 10, marginTop: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepLabel: { fontSize: 14 },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonLabel: { fontSize: 15, fontWeight: '700' },
  linkBtn: { paddingVertical: 4 },
  link: { fontSize: 14 },
});
