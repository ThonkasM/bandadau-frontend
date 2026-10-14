import type { FeedPage } from '@/features/feed/types';

import { buildFeedItem } from './feed';

const TEXTS = [
  'Apuntes de la clase de arquitectura hexagonal 📚',
  'Armamos grupo para el taller de SAGA, ¿alguien más?',
  'Resumen del parcial de eventos, por si les sirve.',
  'Café + código = tarde productiva ☕️',
  'Tips de microfrontends que aprendí hoy.',
  'Subí los diagramas del modelo de dominio al drive.',
];

/** UC-04 mock: posts authored by a given user (profile grid → user feed). */
export function mockUserPosts(userId: string, name = 'Usuario'): FeedPage {
  const items = TEXTS.map((text, index) =>
    buildFeedItem(
      `${userId}-p${index}`,
      name,
      userId,
      text,
      60 + index * 90,
      4 + index * 3,
      (index % 3) + 1,
      index % 2 === 0 ? 'portrait' : 'landscape',
    ),
  );
  return { items, nextCursor: null };
}
