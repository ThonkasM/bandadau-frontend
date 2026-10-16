import type { identity } from '@bandada/contracts-ts';

/** Roles of the platform (catalog §7), sourced from the generated contract. */
export type Role = identity.components['schemas']['Role'];

export const ROLES: readonly Role[] = ['STUDENT', 'ORGANIZER', 'MODERATOR', 'ADMIN'];

/** UC-11: can create/publish events (ORGANIZER or ADMIN). */
export function isOrganizer(roles: readonly Role[] | undefined): boolean {
  return Boolean(roles?.some((role) => role === 'ORGANIZER' || role === 'ADMIN'));
}
