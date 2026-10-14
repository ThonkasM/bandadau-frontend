import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useInfiniteList } from '@/hooks/use-infinite-list';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type { Comment, CommentPage, CommentThread, CreateCommentRequest } from './types';

/** UC-07: comments of a post (cursor paginated, oldest first). */
export function useComments(postId: string | undefined) {
  return useInfiniteList<Comment>({
    queryKey: queryKeys.comments.forPost(postId ?? ''),
    fetchPage: (cursor) =>
      apiRequest<CommentPage>(`/api/v1/posts/${postId}/comments`, {
        query: { cursor, limit: 50 },
      }),
    getId: (comment) => comment.id,
    enabled: Boolean(postId),
  });
}

export function useCreateComment(postId: string) {
  const client = useQueryClient();
  return useMutation<Comment, Error, CreateCommentRequest>({
    mutationFn: (body) =>
      apiRequest<Comment>(`/api/v1/posts/${postId}/comments`, {
        method: 'POST',
        idempotent: true,
        body,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.comments.forPost(postId) }),
  });
}

/** Groups a flat comment list into root comments with their replies. */
export function groupThreads(comments: readonly Comment[]): CommentThread[] {
  const roots: CommentThread[] = [];
  const byId = new Map<string, CommentThread>();
  for (const comment of comments) {
    if (!comment.parentId) {
      const thread = { comment, replies: [] };
      byId.set(comment.id, thread);
      roots.push(thread);
    }
  }
  for (const comment of comments) {
    if (comment.parentId) {
      byId.get(comment.parentId)?.replies.push(comment);
    }
  }
  return roots;
}
