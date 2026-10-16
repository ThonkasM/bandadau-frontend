import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ProfileMenuContent } from '@/features/profile/components/profile-menu-content';
import { SettingsMenuContent } from '@/features/profile/components/settings-menu-content';
import { useDeviceType } from '@/hooks/use-device-type';
import { usePresentableSheet } from '@/hooks/use-presentable-sheet';
import { useTheme, useTokens } from '@/theme/theme-provider';

export interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  /** Web: popover anchor (top/right in window px), aligned with the ⋯ button. */
  anchor?: { top: number; right: number };
}

type MenuView = 'menu' | 'settings';

/** Profile options menu: gorhom bottom sheet on native; popover anchored to the ⋯ button on web. */
export function ProfileMenu({ visible, onClose, anchor }: ProfileMenuProps) {
  const tokens = useTokens();
  const { effective } = useTheme();
  const { isWeb } = useDeviceType();
  const isDark = effective === 'dark';
  const [view, setView] = useState<MenuView>('menu');

  // Closing always returns to the root menu, so the next open starts there.
  // Justificado (B-9): `close` y `backdrop` son referencias estables para `usePresentableSheet` (gorhom);
  // `backgroundStyle` deriva de tokens y se pasa al sheet.
  const close = useCallback(() => {
    setView('menu');
    onClose();
  }, [onClose]);

  const { ref, onDismiss, onChange } = usePresentableSheet(visible, close);

  const content =
    view === 'menu' ? (
      <ProfileMenuContent onClose={close} onOpenSettings={() => setView('settings')} />
    ) : (
      <SettingsMenuContent onBack={() => setView('menu')} onClose={close} />
    );

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
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close}>
          <View style={isDark ? styles.blurDark : styles.blurLight} />
          <View
            style={[
              styles.dim,
              {
                // A dark scrim in both themes (`bg.inverse` is light in dark mode).
                backgroundColor: isDark ? tokens.color.bg.canvas : tokens.color.bg.inverse,
                opacity: isDark ? 0.5 : 0.3,
              },
            ]}
          />
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
          {content}
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
      <BottomSheetView style={styles.sheetContent}>{content}</BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  // Web: blurred backdrop behind the popover (stronger in dark mode).
  blurLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...Platform.select({ web: { backdropFilter: 'blur(2px)' } as object }),
  },
  blurDark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...Platform.select({ web: { backdropFilter: 'blur(5px)' } as object }),
  },
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  popover: {
    position: 'absolute',
    width: 260,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sheetContent: { paddingBottom: 8 },
});
