import { z } from 'zod';

/** Client-side validation mirrors the contract (server is the source of truth). */

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  universityId: z.string().uuid(),
  displayName: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(10).max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/** Client-side domain check (RN-01.1): exact or subdomain match. */
export function isEmailAllowed(email: string, allowedDomains: readonly string[]): boolean {
  const at = email.lastIndexOf('@');
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return allowedDomains.some(
    (allowed) => domain === allowed.toLowerCase() || domain.endsWith(`.${allowed.toLowerCase()}`),
  );
}
