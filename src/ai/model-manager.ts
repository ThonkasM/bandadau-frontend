import NetInfo from '@react-native-community/netinfo';

import { availableBytes } from './free-space';
import type { LocalModelInfo } from './local-llm';
import { requiredFreeBytes } from './model-store';

export type DownloadGate =
  | { ok: true }
  /** Not enough free space (need `missingBytes` more). */
  | { ok: false; reason: 'no-space'; missingBytes: number }
  /** On cellular and the user has not accepted using mobile data (UC-17 §5.3). */
  | { ok: false; reason: 'cellular' };

/**
 * Guards a model download before it starts (UC-17 §5.3 / RN-17.2): enough free space (size × 1.2)
 * and Wi-Fi by default, asking for explicit confirmation before using mobile data.
 */
export async function checkDownload(
  model: LocalModelInfo,
  allowCellular: boolean,
): Promise<DownloadGate> {
  const free = await availableBytes();
  const needed = requiredFreeBytes(model);
  if (free !== null && free < needed) return { ok: false, reason: 'no-space', missingBytes: needed - free };

  // Detect cellular positively: on web `NetInfo` never reports `wifi`/`ethernet` (it falls back to
  // `other`), so gating on "not wifi" wrongly flagged desktop browsers as mobile data.
  const net = await NetInfo.fetch();
  const details = net.details as { isConnectionExpensive?: boolean } | null | undefined;
  const onCellular = net.type === 'cellular' || details?.isConnectionExpensive === true;
  if (onCellular && !allowCellular) return { ok: false, reason: 'cellular' };

  return { ok: true };
}
