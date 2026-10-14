import type { FeedItem, FeedPage, PostMedia } from '@/features/feed/types';

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

type Orientation = 'portrait' | 'landscape' | 'square';

const DIMS: Record<Orientation, [number, number]> = {
  portrait: [900, 1200], // 3:4
  landscape: [1200, 900], // 4:3
  square: [1000, 1000], // 1:1
};

/** Deterministic placeholder image (seeded picsum) with a given orientation. */
function image(seed: string, index: number, orientation: Orientation): PostMedia {
  const [w, h] = DIMS[orientation];
  const uri = `https://picsum.photos/seed/bandada-${seed}-${index}/${w}/${h}`;
  return {
    mediaId: `${seed}-${index}`,
    kind: 'IMAGE',
    status: 'APPROVED',
    url: uri,
    thumbnailUrl: uri,
  };
}

function media(seed: string, count: number, first: Orientation): PostMedia[] {
  const order: Orientation[] = [
    first,
    first === 'portrait' ? 'landscape' : 'portrait',
    'square',
    'portrait',
  ];
  return Array.from({ length: count }, (_, index) => image(seed, index, order[index % order.length]!));
}

function item(
  seed: string,
  displayName: string,
  userId: string,
  text: string,
  minutes: number,
  likes: number,
  images: number,
  first: Orientation,
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
      media: media(seed, images, first),
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
  item('0192f3b0-7c1e-7a2b-9c3d-4e5f60718001', 'Lucía Pérez', '0192f3b0-0000-7000-8000-000000000001', '¡Arrancando Ingeniería de Software II con todo! Alguien para grupo de estudio de arquitectura hexagonal?', 8, 12, 3, 'portrait'),
  item('0192f3b0-7c1e-7a2b-9c3d-4e5f60718002', 'Marco Rojas', '0192f3b0-0000-7000-8000-000000000002', 'Comparto apuntes de la clase de eventos y SAGA. Están en el grupo de la materia.', 45, 30, 1, 'landscape'),
];

const PAGE_2: FeedItem[] = [
  item('0192f3b0-7c1e-7a2b-9c3d-4e5f60718003', 'Sofía Quispe', '0192f3b0-0000-7000-8000-000000000003', 'Recordatorio: mañana hay taller de microfrontends en el laboratorio 3.', 180, 7, 4, 'square'),
];

/** UC-06 mock: cursor `p2` yields the second page, then the end. */
export function mockFeed(query?: Record<string, unknown>): FeedPage {
  const cursor = typeof query?.cursor === 'string' ? query.cursor : undefined;
  if (!cursor) return { items: PAGE_1, nextCursor: 'p2' };
  if (cursor === 'p2') return { items: PAGE_2, nextCursor: null };
  return { items: [], nextCursor: null };
}
