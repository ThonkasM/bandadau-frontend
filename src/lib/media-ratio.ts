export type Orientation = 'portrait' | 'landscape' | 'square';

export interface TargetRatio {
  ratio: number;
  orientation: Orientation;
}

/**
 * Instagram crop convention for the feed:
 * portrait → 4:5, landscape → 1.91:1, square → 1:1.
 * (Media is cropped to fill this ratio with `contentFit="cover"`.)
 */
export const IG_RATIOS = {
  portrait: 4 / 5,
  landscape: 1.91,
  square: 1,
} as const;

export const DEFAULT_MEDIA_RATIO = IG_RATIOS.portrait;

export function targetRatio(width: number, height: number): TargetRatio {
  if (!width || !height) return { ratio: DEFAULT_MEDIA_RATIO, orientation: 'portrait' };
  if (height > width) return { ratio: IG_RATIOS.portrait, orientation: 'portrait' };
  if (width > height) return { ratio: IG_RATIOS.landscape, orientation: 'landscape' };
  return { ratio: IG_RATIOS.square, orientation: 'square' };
}
