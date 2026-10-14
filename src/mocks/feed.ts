import type { FeedItem, FeedPage, PostMedia } from '@/features/feed/types';

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

/** Deterministic placeholder image (seeded picsum) so it is stable across renders. */
function image(seed: string, index: number): PostMedia {
  const uri = `https://picsum.photos/seed/bandada-${seed}-${index}/900/900`;
  return { mediaId: `${seed}-${index}`, kind: 'IMAGE', status: 'APPROVED', url: uri, thumbnailUrl: uri };
}

function media(seed: string, count: number): PostMedia[] {
  return Array.from({ length: count }, (_, index) => image(seed, index));
}

function item(
  seed: string,
  displayName: string,
  userId: string,
  text: string,
  minutes: number,
  likes: number,
  images: number,
): FeedItem {
  return {
    source: 'FOLLOWING',
    score: 1,
    post: {
      id: seed,
      clientId: seed,
      authorId: userId,
      author: { userId, displayName, avatarUrl: null },
      text,
      hashtags: [],
      media: media(seed, images),
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      groupId: null,
      myReaction: null,
      reactionCounts: { like: likes, support: 0, helpful: 0, funny: 0 },
      commentsCount: 3,
      createdAt: minutesAgo(minutes),
      updatedAt: minutesAgo(minutes),
    },
  };
}

const PAGE_1: FeedItem[] = [
  item('0192f3b0-7c1e-7a2b-9c3d-4e5f60718001', 'Lucía Pérez', '0192f3b0-0000-7000-8000-000000000001', '¡Arrancando Ingeniería de Software II con todo! Alguien para grupo de estudio de arquitectura hexagonal?', 8, 12, 3),
  item('0192f3b0-7c1e-7a2b-9c3d-4e5f60718002', 'Marco Rojas', '0192f3b0-0000-7000-8000-000000000002', 'Comparto apuntes de la clase de eventos y SAGA. Están en el grupo de la materia.', 45, 30, 1),
];

const PAGE_2: FeedItem[] = [
  item('0192f3b0-7c1e-7a2b-9c3d-4e5f60718003', 'Sofía Quispe', '0192f3b0-0000-7000-8000-000000000003', 'Recordatorio: mañana hay taller de microfrontends en el laboratorio 3.', 180, 7, 4),
];

/** UC-06 mock: cursor `p2` yields the second page, then the end. */
export function mockFeed(query?: Record<string, unknown>): FeedPage {
  const cursor = typeof query?.cursor === 'string' ? query.cursor : undefined;
  if (!cursor) return { items: PAGE_1, nextCursor: 'p2' };
  if (cursor === 'p2') return { items: PAGE_2, nextCursor: null };
  return { items: [], nextCursor: null };
}
