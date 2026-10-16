import type { social } from '@bandada/contracts-ts';

/** Group types aliased from `@bandada/contracts-ts` (openapi/social). */
export type Group = social.components['schemas']['Group'];
export type GroupPrivacy = Group['privacy'];
export type GroupMembership = social.components['schemas']['GroupMembership'];
export type GroupMemberRole = social.components['schemas']['GroupMemberRole'];
export type MembershipStatus = social.components['schemas']['MembershipStatus'];
export type CreateGroupRequest = social.components['schemas']['CreateGroupRequest'];

/** `GET /api/v1/groups` → `{ items, nextCursor }`. */
export type GroupPage = social.components['schemas']['CursorPageMeta'] & { items: Group[] };

/** `GET /api/v1/groups/{id}/members` → `{ items, nextCursor }`. */
export type GroupMembershipPage = social.components['schemas']['CursorPageMeta'] & {
  items: GroupMembership[];
};
