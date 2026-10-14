/** Roles available in Club Bandada U (catalog §7). */
export const ROLES = ['STUDENT', 'ORGANIZER', 'MODERATOR', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];
