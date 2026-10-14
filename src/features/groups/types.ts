import type { social } from '@bandada/contracts-ts';

/** Group types aliased from `@bandada/contracts-ts` (openapi/social). */
export type Group = social.components['schemas']['Group'];
export type GroupPrivacy = Group['privacy'];

/** `GET /api/v1/groups` → `{ items, nextCursor }`. */
export type GroupPage = social.components['schemas']['CursorPageMeta'] & { items: Group[] };
