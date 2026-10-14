import type { social } from '@bandada/contracts-ts';

/** Social types aliased from `@bandada/contracts-ts` (openapi/social). */
export type FeedItem = social.components['schemas']['FeedItem'];
export type Post = social.components['schemas']['Post'];
export type ProfileSummary = social.components['schemas']['ProfileSummary'];

/** `GET /api/v1/feed` → `{ items, nextCursor }` (cursor pagination). */
export type FeedPage = social.components['schemas']['CursorPageMeta'] & { items: FeedItem[] };
