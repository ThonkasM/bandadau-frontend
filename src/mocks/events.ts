import type { Event, EventPage, Registration } from '@/features/events/types';

function inDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

const NOW = new Date().toISOString();

const EVENTS: Event[] = [
  {
    id: '0192f3d0-0000-7000-8000-000000000001',
    organizerId: '0192f3b0-0000-7000-8000-000000000002',
    title: 'Charla de arquitectura hexagonal',
    description: 'Introducción a puertos y adaptadores con ejemplos en Java y PHP.',
    venue: 'Auditorio A',
    startsAt: inDays(2),
    priceCredits: 0,
    capacity: 100,
    seatsTaken: 34,
    seatsAvailable: 66,
    status: 'PUBLISHED',
    coverMediaId: null,
    coverUrl: null,
    publishedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: '0192f3d0-0000-7000-8000-000000000002',
    organizerId: '0192f3b0-0000-7000-8000-000000000002',
    title: 'Taller de SAGA de inscripción',
    description: 'Inscripción pagada de punta a punta: reserva, débito, ticket y compensación.',
    venue: 'Laboratorio 3',
    startsAt: inDays(5),
    priceCredits: 20,
    capacity: 40,
    seatsTaken: 12,
    seatsAvailable: 28,
    status: 'PUBLISHED',
    coverMediaId: null,
    coverUrl: null,
    publishedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: '0192f3d0-0000-7000-8000-000000000003',
    organizerId: '0192f3b0-0000-7000-8000-000000000002',
    title: 'Clase intensiva de microfrontends (cupo 1)',
    description: 'Cupo limitado para probar EVENT_FULL.',
    venue: 'Sala de videoconferencia',
    startsAt: inDays(7),
    priceCredits: 0,
    capacity: 1,
    seatsTaken: 0,
    seatsAvailable: 1,
    status: 'PUBLISHED',
    coverMediaId: null,
    coverUrl: null,
    publishedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export function mockEvents(): EventPage {
  return { items: EVENTS, nextCursor: null };
}

export function mockEvent(id: string): Event | undefined {
  return EVENTS.find((event) => event.id === id);
}

const REG_EVENTS = new Map<string, string>();
const REG_CALLS = new Map<string, number>();
const CONFIRM_AFTER = 3;

function buildRegistration(
  id: string,
  event: Event,
  status: Registration['status'],
  ticketId: string | null,
): Registration {
  return {
    id,
    eventId: event.id,
    userId: '0192f3b0-0000-7000-8000-000000000001',
    status,
    priceCredits: event.priceCredits,
    ticketId,
    failureReason: null,
    createdAt: NOW,
    updatedAt: NOW,
    confirmedAt: status === 'CONFIRMED' ? NOW : null,
    cancelledAt: null,
    event: {
      id: event.id,
      title: event.title,
      venue: event.venue,
      startsAt: event.startsAt,
    },
  };
}

/** UC-12: start a registration (SAGA begins in PENDING). */
export function mockRegister(eventId: string): Registration {
  const event = mockEvent(eventId) ?? EVENTS[0]!;
  const id = '0192f3d0-0000-7000-8000-0000000000aa';
  REG_EVENTS.set(id, event.id);
  REG_CALLS.set(id, 0);
  return buildRegistration(id, event, 'PENDING', null);
}

/** UC-12: poll a registration; after a few calls the simulated SAGA confirms. */
export function mockRegistration(registrationId: string): Registration {
  const eventId = REG_EVENTS.get(registrationId) ?? EVENTS[1]!.id;
  const event = mockEvent(eventId) ?? EVENTS[1]!;
  const calls = (REG_CALLS.get(registrationId) ?? 0) + 1;
  REG_CALLS.set(registrationId, calls);
  const confirmed = calls >= CONFIRM_AFTER;
  return buildRegistration(
    registrationId,
    event,
    confirmed ? 'CONFIRMED' : 'PENDING',
    confirmed ? '0192f3e0-0000-7000-8000-0000000000bb' : null,
  );
}
