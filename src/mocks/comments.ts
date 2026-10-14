import type { Comment, CommentPage } from '@/features/comments/types';

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

/** UC-07 mock: a couple of root comments and one reply, per post. */
export function mockComments(postId: string): CommentPage {
  const root1: Comment = {
    id: `${postId}-c1`,
    postId,
    authorId: '0192f3b0-0000-7000-8000-000000000002',
    author: { userId: '0192f3b0-0000-7000-8000-000000000002', displayName: 'Marco Rojas', avatarUrl: null },
    text: '¡Buenísimo! ¿Compartes el repo?',
    status: 'VISIBLE',
    createdAt: minutesAgo(30),
    replyCount: 1,
  };
  const reply1: Comment = {
    id: `${postId}-c1-r1`,
    postId,
    authorId: '0192f3b0-0000-7000-8000-000000000001',
    author: { userId: '0192f3b0-0000-7000-8000-000000000001', displayName: 'Lucía Pérez', avatarUrl: null },
    text: '¡Claro! Te lo paso por el grupo.',
    status: 'VISIBLE',
    createdAt: minutesAgo(24),
    parentId: root1.id,
  };
  const root2: Comment = {
    id: `${postId}-c2`,
    postId,
    authorId: '0192f3b0-0000-7000-8000-000000000003',
    author: { userId: '0192f3b0-0000-7000-8000-000000000003', displayName: 'Sofía Quispe', avatarUrl: null },
    text: 'Yo también quiero entrar al grupo de estudio 🙌',
    status: 'VISIBLE',
    createdAt: minutesAgo(12),
    replyCount: 0,
  };
  return { items: [root1, reply1, root2], nextCursor: null };
}

export function mockCreateComment(postId: string, text: string, parentId?: string): Comment {
  return {
    id: `${postId}-new-${Date.now()}`,
    postId,
    authorId: '0192f3b0-0000-7000-8000-000000000001',
    author: { userId: '0192f3b0-0000-7000-8000-000000000001', displayName: 'Lucía Pérez', avatarUrl: null },
    text,
    status: 'VISIBLE',
    createdAt: new Date().toISOString(),
    parentId,
  };
}
