import { DEFAULT_MEDIA_RATIO, IG_RATIOS, targetRatio } from './media-ratio';

describe('targetRatio', () => {
  it('portrait when height > width', () => {
    expect(targetRatio(900, 1200)).toEqual({ ratio: 0.75, orientation: 'portrait' });
  });

  it('keeps tall 9:16 photos whole', () => {
    expect(targetRatio(1080, 1920)).toEqual({ ratio: 1080 / 1920, orientation: 'portrait' });
  });

  it('clamps extreme portraits and panoramas', () => {
    expect(targetRatio(500, 2000).ratio).toBeCloseTo(9 / 16);
    expect(targetRatio(4000, 500).ratio).toBe(IG_RATIOS.landscape);
  });

  it('landscape when width > height', () => {
    expect(targetRatio(1200, 900)).toEqual({ ratio: 1200 / 900, orientation: 'landscape' });
  });

  it('square when equal', () => {
    expect(targetRatio(1000, 1000)).toEqual({ ratio: IG_RATIOS.square, orientation: 'square' });
  });

  it('falls back to the default when dimensions are missing', () => {
    expect(targetRatio(0, 0)).toEqual({ ratio: DEFAULT_MEDIA_RATIO, orientation: 'portrait' });
  });
});
