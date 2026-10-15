import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, useTokens } from '@/theme/theme-provider';

export type PaymentPhase = 'processing' | 'confirmed' | 'failed';

export interface PaymentCopy {
  processing: {
    title: string;
    subtitle?: string;
    steps: [string, string, string];
    note?: string;
  };
  confirmed: {
    title: string;
    subtitle?: string;
    primaryLabel: string;
    onPrimary: () => void;
    secondaryLabel?: string;
  };
  failed: {
    title: string;
    message?: string;
    primaryLabel: string;
    onPrimary: () => void;
    secondaryLabel?: string;
  };
}

const STEP_MS = 900;
const STEP_COUNT = 3;

/** Animated reserve → charge → settle checklist (mounts only while processing). */
function PaymentSteps({ labels }: { labels: [string, string, string] }) {
  const tokens = useTokens();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEP_COUNT - 1)), STEP_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.steps}>
      {labels.map((label, i) => (
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
 * Generic simulated-payment modal: a loader with steps while the (server-side)
 * operation runs, then the outcome (success or failure). Used by event
 * registration (UC-12) and wallet top-up (UC-15).
 */
export function PaymentModal({
  visible,
  phase,
  copy,
  onClose,
}: {
  visible: boolean;
  phase: PaymentPhase;
  copy: PaymentCopy;
  onClose: () => void;
}) {
  const tokens = useTokens();
  const { effective } = useTheme();
  const scrim = effective === 'dark' ? tokens.color.bg.canvas : tokens.color.bg.inverse;

  const outcome = phase === 'confirmed' ? copy.confirmed : copy.failed;
  const detail = phase === 'confirmed' ? copy.confirmed.subtitle : copy.failed.message;
  const outcomeIcon = phase === 'confirmed' ? 'check-circle' : 'alert-circle';
  const outcomeColor =
    phase === 'confirmed' ? tokens.color.feedback.success.fg : tokens.color.feedback.danger.fg;

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
                {copy.processing.title}
              </Text>
              {copy.processing.subtitle ? (
                <Text style={[styles.subtitle, { color: tokens.color.text.muted }]}>
                  {copy.processing.subtitle}
                </Text>
              ) : null}
              <PaymentSteps labels={copy.processing.steps} />
              {copy.processing.note ? (
                <Text style={[styles.hint, { color: tokens.color.text.muted }]}>
                  {copy.processing.note}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <MaterialCommunityIcons name={outcomeIcon} size={56} color={outcomeColor} />
              <Text style={[styles.title, { color: tokens.color.text.primary }]}>
                {outcome.title}
              </Text>
              {detail ? (
                <Text style={[styles.subtitle, { color: tokens.color.text.muted }]}>{detail}</Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={outcome.onPrimary}
                style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}
              >
                <Text style={[styles.buttonLabel, { color: tokens.color.action.primary.fg }]}>
                  {outcome.primaryLabel}
                </Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.linkBtn}>
                <Text style={[styles.link, { color: tokens.color.text.muted }]}>
                  {outcome.secondaryLabel}
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
