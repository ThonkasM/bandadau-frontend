import { newClientId, newCorrelationId, newUuid } from './ids';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('ids', () => {
  it('newUuid returns an RFC 4122 UUID', () => {
    expect(newUuid()).toMatch(UUID_RE);
  });

  it('newCorrelationId returns an RFC 4122 UUID', () => {
    expect(newCorrelationId()).toMatch(UUID_RE);
  });

  it('newClientId returns a v7 (time-ordered) UUID', () => {
    const id = newClientId();
    expect(id).toMatch(UUID_RE);
    expect(id[14]).toBe('7');
    expect('89ab').toContain(id[19]);
  });

  it('newClientId time prefix is non-decreasing', () => {
    const a = newClientId();
    const b = newClientId();
    expect(a.slice(0, 8) <= b.slice(0, 8)).toBe(true);
  });
});
