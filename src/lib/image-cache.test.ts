import { cachedSource, stableImageKey } from './image-cache';

describe('stableImageKey', () => {
  it('drops the presigned query string', () => {
    expect(stableImageKey('https://s3.x/bucket/a/b.jpg?X-Amz-Signature=1&X-Amz-Date=2')).toBe(
      'https://s3.x/bucket/a/b.jpg',
    );
  });
  it('keeps urls without query', () => {
    expect(stableImageKey('https://x/y.png')).toBe('https://x/y.png');
  });
});

describe('cachedSource', () => {
  it('returns undefined without a url', () => {
    expect(cachedSource(null)).toBeUndefined();
  });
  it('sets uri and cacheKey', () => {
    expect(cachedSource('https://x/y.png?sig=1')).toEqual({
      uri: 'https://x/y.png?sig=1',
      cacheKey: 'https://x/y.png',
    });
  });
});
