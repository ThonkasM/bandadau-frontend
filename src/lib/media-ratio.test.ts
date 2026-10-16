import { DEFAULT_MEDIA_RATIO, IG_RATIOS, targetRatio } from './media-ratio';

describe('targetRatio', () => {
  it('portrait when height > width', () => {
    expect(targetRatio(900, 1200)).toEqual({
      ratio: IG_RATIOS.portrait,
      orientation: 'portrait',
    });
  });

  it('landscape when width > height', () => {
    expect(targetRatio(1200, 900)).toEqual({
      ratio: IG_RATIOS.landscape,
      orientation: 'landscape',
    });
  });

  it('square when equal', () => {
    expect(targetRatio(1000, 1000)).toEqual({ ratio: IG_RATIOS.square, orientation: 'square' });
  });

  it('falls back to the default when dimensions are missing', () => {
    expect(targetRatio(0, 0)).toEqual({ ratio: DEFAULT_MEDIA_RATIO, orientation: 'portrait' });
  });
});
