import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { BandadaLoader } from '@/components/brand/BandadaLogo';
import { Text } from '@/components/ui/text';
import { useTheme, useTokens } from '@/theme/theme-provider';
import { useBrand } from '@/theme/use-brand';

export type ProgressPhase = 'processing' | 'done' | 'failed';

export interface ProgressOutcome {
  title: string;
  subtitle?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
}

export interface ProgressModalProps {
  visible: boolean;
  phase: ProgressPhase;
  /** Title while processing. */
  title: string;
  /** Optional sub-step label (e.g. "Subiendo imagen 2/3"). */
  subtitle?: string;
  /** Real progress in `[0, 1]`; omit for an indeterminate bar. */
  progress?: number;
  /** Step labels, ticked as `step` advances. */
  steps?: readonly string[];
  step?: number;
  done: ProgressOutcome;
  failed: ProgressOutcome;
  onClose: () => void;
}

/**
 * Progress modal with a real progress bar (UC-05 publishing): steps + a bar while the content
 * uploads and the post is created, then the outcome. Mirrors the `PaymentModal` visual language.
 */
export function ProgressModal({
  visible,
  phase,
  title,
  subtitle,
  progress,
  steps,
  step = 0,
  done,
  failed,
  onClose,
}: ProgressModalProps) {
  const tokens = useTokens();
  const brand = useBrand();
  const { effective } = useTheme();
  const scrim = effective === 'dark' ? tokens.color.bg.canvas : tokens.color.bg.inverse;
  const outcome = phase === 'done' ? done : failed;
  const determinate = typeof progress === 'number';

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
          ]}>
          {phase === 'processing' ? (
            <>
              <BandadaLoader size={72} color={brand.color} accent={brand.accent} />
              <Text style={[styles.title, { color: tokens.color.text.primary }]}>{title}</Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: tokens.color.text.muted }]}>{subtitle}</Text>
              ) : null}

              <View style={[styles.track, { backgroundColor: tokens.color.bg.muted }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: tokens.color.brand.accent,
                      width: determinate ? `${Math.round(Math.min(Math.max(progress, 0), 1) * 100)}%` : '100%',
                      opacity: determinate ? 1 : 0.5,
                    },
                  ]}
                />
              </View>

              {steps ? (
                <View style={styles.steps}>
                  {steps.map((label, index) => (
                    <View key={label} style={styles.stepRow}>
                      <MaterialCommunityIcons
                        name={
                          index < step ? 'check-circle' : index === step ? 'progress-clock' : 'circle-outline'
                        }
                        size={18}
                        color={index <= step ? tokens.color.action.primary.bg : tokens.color.text.muted}
                      />
                      <Text
                        style={[
                          styles.stepLabel,
                          { color: index <= step ? tokens.color.text.primary : tokens.color.text.muted },
                        ]}>
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <>
              <MaterialCommunityIcons
                name={phase === 'done' ? 'check-circle' : 'alert-circle'}
                size={56}
                color={
                  phase === 'done' ? tokens.color.feedback.success.fg : tokens.color.feedback.danger.fg
                }
              />
              <Text style={[styles.title, { color: tokens.color.text.primary }]}>{outcome.title}</Text>
              {outcome.subtitle ? (
                <Text style={[styles.subtitle, { color: tokens.color.text.muted }]}>
                  {outcome.subtitle}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={outcome.onPrimary}
                style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
                <Text style={[styles.buttonLabel, { color: tokens.color.action.primary.fg }]}>
                  {outcome.primaryLabel}
                </Text>
              </Pressable>
              {outcome.secondaryLabel ? (
                <Pressable accessibilityRole="button" onPress={onClose} style={styles.linkBtn}>
                  <Text style={[styles.link, { color: tokens.color.text.muted }]}>
                    {outcome.secondaryLabel}
                  </Text>
                </Pressable>
              ) : null}
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
  track: { alignSelf: 'stretch', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', borderRadius: 4 },
  steps: { alignSelf: 'stretch', gap: 10, marginTop: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepLabel: { fontSize: 14 },
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
