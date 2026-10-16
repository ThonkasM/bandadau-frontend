import { isEmailAllowed, loginSchema, registerSchema, verifyEmailSchema } from './schemas';

const UNIVERSITY_ID = '01890000-0000-7000-8000-000000000000';

describe('loginSchema', () => {
  it('accepts a valid institutional email + password', () => {
    const r = loginSchema.safeParse({ email: 'lucia@umsa.edu.bo', password: 'Bandada#2026' });
    expect(r.success).toBe(true);
  });

  it('rejects a malformed email', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: 'Bandada#2026' }).success).toBe(false);
  });

  it('rejects a too-short password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'short' }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('accepts a full valid payload', () => {
    const r = registerSchema.safeParse({
      universityId: UNIVERSITY_ID,
      displayName: 'Lucía',
      email: 'lucia@umsa.edu.bo',
      password: 'Bandada#2026',
    });
    expect(r.success).toBe(true);
  });

  it('requires a uuid university, a name and a 10+ password', () => {
    const r = registerSchema.safeParse({
      universityId: 'not-a-uuid',
      displayName: '',
      email: 'lucia@umsa.edu.bo',
      password: 'short',
    });
    expect(r.success).toBe(false);
  });
});

describe('verifyEmailSchema', () => {
  it('accepts a 6-digit code and rejects anything else', () => {
    expect(verifyEmailSchema.safeParse({ email: 'a@b.co', code: '123456' }).success).toBe(true);
    expect(verifyEmailSchema.safeParse({ email: 'a@b.co', code: '12345' }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ email: 'a@b.co', code: 'abcdef' }).success).toBe(false);
  });
});

describe('isEmailAllowed', () => {
  it('matches the exact domain and its subdomains (RN-01.1)', () => {
    expect(isEmailAllowed('a@umsa.edu.bo', ['umsa.edu.bo'])).toBe(true);
    expect(isEmailAllowed('a@ing.umsa.edu.bo', ['umsa.edu.bo'])).toBe(true);
  });

  it('rejects other domains and malformed emails', () => {
    expect(isEmailAllowed('a@gmail.com', ['umsa.edu.bo'])).toBe(false);
    expect(isEmailAllowed('nope', ['umsa.edu.bo'])).toBe(false);
  });
});
