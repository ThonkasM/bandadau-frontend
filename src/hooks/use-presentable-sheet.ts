import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Robust open/close for `BottomSheetModal` driven by a `visible` prop
 * (adapted from Homy's `usePresentableSheet`).
 *
 * - `isPresentedRef` mirrors the real sheet state (not the prop) and is only
 *   touched in the effect and `onDismiss`/`onChange`.
 * - `justPresentedRef` ignores the spurious `onChange` gorhom v5 emits right
 *   after `present()`.
 * - `present()` runs in `requestAnimationFrame` so the modal is mounted first;
 *   closing is always `dismiss()`.
 *
 * Buttons that close the sheet (X, Apply) must only call `onClose()`.
 */
export function usePresentableSheet(visible: boolean, onClose: () => void) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const justPresentedRef = useRef(false);

  useEffect(() => {
    if (visible && !isPresentedRef.current) {
      isPresentedRef.current = true;
      justPresentedRef.current = true;
      const raf = requestAnimationFrame(() => {
        ref.current?.present();
      });
      return () => cancelAnimationFrame(raf);
    }
    if (!visible && isPresentedRef.current) {
      isPresentedRef.current = false;
      ref.current?.dismiss();
    }
  }, [visible]);

  const onDismiss = useCallback(() => {
    isPresentedRef.current = false;
    onClose();
  }, [onClose]);

  const onChange = useCallback(
    (index: number) => {
      if (justPresentedRef.current) {
        justPresentedRef.current = false;
        return;
      }
      if (index < 0) {
        isPresentedRef.current = false;
        onClose();
      }
    },
    [onClose],
  );

  return { ref, onDismiss, onChange };
}
