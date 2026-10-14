import type { identity } from '@bandada/contracts-ts';

/** Roles of the platform (catalog §7), sourced from the generated contract. */
export type Role = identity.components['schemas']['Role'];

export const ROLES: readonly Role[] = ['STUDENT', 'ORGANIZER', 'MODERATOR', 'ADMIN'];
