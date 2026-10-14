import type { Comment, CommentPage } from '@/features/comments/types';

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

const AUTHORS = [
  { id: '0192f3b0-0000-7000-8000-000000000002', name: 'Marco Rojas' },
  { id: '0192f3b0-0000-7000-8000-000000000003', name: 'Sofía Quispe' },
  { id: '0192f3b0-0000-7000-8000-000000000004', name: 'Diego Flores' },
  { id: '0192f3b0-0000-7000-8000-000000000005', name: 'Valeria Gómez' },
];

const ROOT_TEXTS = [
  '¡Buenísimo! ¿Compartes el repo?',
  'Yo también quiero entrar al grupo de estudio 🙌',
  '¿A qué hora es la próxima sesión?',
  'Ese patrón me costó entenderlo, gracias por el resumen.',
  'Sumen a Marco, es crack en diagramas.',
  '¿Hacemos un grupo aparte para la SAGA?',
  'Excelente, lo comento en mi grupo.',
  '¿Pueden grabar la clase? No pude ir.',
  'Justo lo que necesitaba para el parcial.',
  '¿Alguien más tiene apuntes de eventos?',
  'Guardado. Mil gracias.',
  'Deberíamos armar un mini-workshop.',
];

const REPLY_TEXTS = [
  '¡Claro! Te lo paso por el grupo.',
  'Yo me sumo, avisen horario.',
  'Sí, lo subo a la carpeta compartida.',
  'Dale, coordinamos por privado.',
  'Gracias por responder 🙏',
];

const AUTHOR_OF = (index: number) => AUTHORS[index % AUTHORS.length]!;

/** UC-07 mock: many comments (with replies) so the sheet scroll + expand is visible. */
export function mockComments(postId: string): CommentPage {
  const items: Comment[] = [];
  const replyCounts = [3, 2, 1, 0, 2, 1, 0, 1, 0, 0, 0, 0];

  ROOT_TEXTS.forEach((text, index) => {
    const author = AUTHOR_OF(index);
    const root: Comment = {
      id: `${postId}-c${index}`,
      postId,
      authorId: author.id,
      author: { userId: author.id, displayName: author.name, avatarUrl: null },
      text,
      status: 'VISIBLE',
      createdAt: minutesAgo(180 - index * 12),
      replyCount: replyCounts[index] ?? 0,
    };
    items.push(root);

    const replies = replyCounts[index] ?? 0;
    for (let r = 0; r < replies; r += 1) {
      const replyAuthor = AUTHOR_OF(index + r + 1);
      items.push({
        id: `${root.id}-r${r}`,
        postId,
        authorId: replyAuthor.id,
        author: { userId: replyAuthor.id, displayName: replyAuthor.name, avatarUrl: null },
        text: REPLY_TEXTS[(index + r) % REPLY_TEXTS.length]!,
        status: 'VISIBLE',
        createdAt: minutesAgo(170 - index * 12 - r),
        parentId: root.id,
      });
    }
  });

  return { items, nextCursor: null };
}

export function mockCreateComment(postId: string, text: string, parentId?: string): Comment {
  const me = { id: '0192f3b0-0000-7000-8000-000000000001', name: 'Lucía Pérez' };
  return {
    id: `${postId}-new-${Date.now()}`,
    postId,
    authorId: me.id,
    author: { userId: me.id, displayName: me.name, avatarUrl: null },
    text,
    status: 'VISIBLE',
    createdAt: new Date().toISOString(),
    parentId,
  };
}
