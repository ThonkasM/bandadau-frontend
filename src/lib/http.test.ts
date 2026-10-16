import { buildHeaders, buildUrl } from './http';

describe('buildUrl', () => {
  it('appends only defined query params', () => {
    const url = buildUrl('/api/v1/feed', { cursor: 'p2', limit: 20, status: undefined });
    expect(url).toContain('/api/v1/feed?');
    expect(url).toContain('cursor=p2');
    expect(url).toContain('limit=20');
    expect(url).not.toContain('status');
  });

  it('keeps an absolute url as-is', () => {
    expect(buildUrl('https://example.com/x')).toBe('https://example.com/x');
  });
});

describe('buildHeaders', () => {
  it('sends Authorization when a token is present (auth not explicitly false)', () => {
    expect(buildHeaders({ accessToken: 'tok' }, 'corr').Authorization).toBe('Bearer tok');
  });

  it('omits Authorization when auth === false', () => {
    expect(buildHeaders({ auth: false, accessToken: 'tok' }, 'corr').Authorization).toBeUndefined();
  });

  it('omits Authorization when there is no token', () => {
    expect(buildHeaders({}, 'corr').Authorization).toBeUndefined();
  });

  it('sets the client header per platform (native in the jest env)', () => {
    expect(buildHeaders({}, 'corr')['X-Bandada-Client']).toBe('native');
  });

  it('sets Accept-Language only when a locale is provided', () => {
    expect(buildHeaders({ locale: 'en' }, 'corr')['Accept-Language']).toBe('en');
    expect(buildHeaders({}, 'corr')['Accept-Language']).toBeUndefined();
  });

  it('sets Content-Type only when there is a body', () => {
    expect(buildHeaders({}, 'corr')['Content-Type']).toBeUndefined();
    expect(buildHeaders({ body: { a: 1 } }, 'corr')['Content-Type']).toBe('application/json');
  });

  it('reuses a provided Idempotency-Key', () => {
    expect(buildHeaders({ idempotent: true, idempotencyKey: 'k1' }, 'corr')['Idempotency-Key']).toBe(
      'k1',
    );
  });

  it('always carries the correlation id', () => {
    expect(buildHeaders({}, 'abc')['X-Correlation-Id']).toBe('abc');
  });
});
