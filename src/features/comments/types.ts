import type { social } from '@bandada/contracts-ts';

/** Comment types aliased from `@bandada/contracts-ts` (openapi/social). */
export type Comment = social.components['schemas']['Comment'];
export type CreateCommentRequest = social.components['schemas']['CreateCommentRequest'];
export type CommentPage = social.components['schemas']['CursorPageMeta'] & { items: Comment[] };

/** A root comment with its direct replies (one nesting level, UC-07). */
export interface CommentThread {
  comment: Comment;
  replies: Comment[];
}
