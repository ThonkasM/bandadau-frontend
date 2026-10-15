import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { useCallback, useMemo } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ProfileMenuContent } from '@/features/profile/components/profile-menu-content';
import { useDeviceType } from '@/hooks/use-device-type';
import { usePresentableSheet } from '@/hooks/use-presentable-sheet';
import { useTokens } from '@/theme/theme-provider';

export interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  /** Web desktop: popover anchor (top/right in window px), aligned with the ⋯ button. */
  anchor?: { top: number; right: number };
}

/** Profile options menu: gorhom bottom sheet on native; popover anchored to the ⋯ button on web. */
export function ProfileMenu({ visible, onClose, anchor }: ProfileMenuProps) {
  const tokens = useTokens();
  const { isWeb } = useDeviceType();
  const { ref, onDismiss, onChange } = usePresentableSheet(visible, onClose);

  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: tokens.color.bg.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    }),
    [tokens.color.bg.surface],
  );

  if (isWeb) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={styles.blur} />
          <View style={[styles.dim, { backgroundColor: tokens.color.bg.inverse }]} />
        </Pressable>
        <View
          style={[
            styles.popover,
            {
              top: anchor?.top ?? 64,
              right: anchor?.right ?? 12,
              backgroundColor: tokens.color.bg.surface,
              borderColor: tokens.color.border.default,
            },
          ]}>
          <ProfileMenuContent onClose={onClose} />
        </View>
      </Modal>
    );
  }

  return (
    <BottomSheetModal
      ref={ref}
      enablePanDownToClose
      handleComponent={null}
      backdropComponent={backdrop}
      backgroundStyle={backgroundStyle}
      onChange={onChange}
      onDismiss={onDismiss}>
      <ProfileMenuContent onClose={onClose} />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  // Web: blurred backdrop behind the popover (like Homy's filters overlay).
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...Platform.select({ web: { backdropFilter: 'blur(2px)' } as object }),
  },
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.25 },
  popover: {
    position: 'absolute',
    width: 260,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
