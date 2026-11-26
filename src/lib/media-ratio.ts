export type Orientation = 'portrait' | 'landscape' | 'square';

export interface TargetRatio {
  ratio: number;
  orientation: Orientation;
}

/**
 * Feed frame: respects the image's real aspect ratio, clamped to a sane range so extreme
 * panoramas / very tall screenshots do not produce absurd cards (only those are cropped).
 * Range: tall 9:16 … wide 1.91:1. A 4:5, 3:4, 9:16 or 4:3 photo is shown whole.
 */
export const IG_RATIOS = {
  portrait: 4 / 5,
  landscape: 1.91,
  square: 1,
} as const;

export const MIN_MEDIA_RATIO = 9 / 16;
export const MAX_MEDIA_RATIO = IG_RATIOS.landscape;

export const DEFAULT_MEDIA_RATIO = IG_RATIOS.portrait;

export function targetRatio(width: number, height: number): TargetRatio {
  if (!width || !height) return { ratio: DEFAULT_MEDIA_RATIO, orientation: 'portrait' };
  const ratio = Math.min(MAX_MEDIA_RATIO, Math.max(MIN_MEDIA_RATIO, width / height));
  if (height > width) return { ratio, orientation: 'portrait' };
  if (width > height) return { ratio, orientation: 'landscape' };
  return { ratio: IG_RATIOS.square, orientation: 'square' };
}
