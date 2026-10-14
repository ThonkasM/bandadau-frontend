import type { NotificationPage } from '@/features/notifications/types';

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

const ITEMS = [
  {
    id: '0192f3c0-0000-7000-8000-000000000001',
    userId: '0192f3b0-0000-7000-8000-000000000001',
    type: 'REGISTRATION_CONFIRMED' as const,
    title: 'Inscripción confirmada',
    body: 'Tu inscripción al taller de arquitectura se confirmó. ¡Nos vemos!',
    data: { deepLink: '/registrations/0192f3c0-0000-7000-8000-0000000000aa' },
    locale: 'es' as const,
    readAt: null,
    createdAt: minutesAgo(3),
  },
  {
    id: '0192f3c0-0000-7000-8000-000000000002',
    userId: '0192f3b0-0000-7000-8000-000000000001',
    type: 'NEW_FOLLOWER' as const,
    title: 'Nuevo seguidor',
    body: 'Marco Rojas empezó a seguirte.',
    data: { deepLink: '/profile/0192f3b0-0000-7000-8000-000000000002' },
    locale: 'es' as const,
    readAt: minutesAgo(30),
    createdAt: minutesAgo(40),
  },
];

/** UC-24 mock: single page. */
export function mockNotifications(): NotificationPage {
  return { items: ITEMS, nextCursor: null };
}
