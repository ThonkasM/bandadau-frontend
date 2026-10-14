import type { Ticket, TicketPage } from '@/features/tickets/types';

const NOW = new Date().toISOString();

const TICKET: Ticket = {
  id: '0192f3e0-0000-7000-8000-0000000000bb',
  eventId: '0192f3d0-0000-7000-8000-000000000002',
  userId: '0192f3b0-0000-7000-8000-000000000001',
  registrationId: '0192f3d0-0000-7000-8000-0000000000aa',
  status: 'ISSUED',
  issuedAt: NOW,
  usedAt: null,
  voidedAt: null,
  eventTitle: 'Taller de SAGA de inscripción',
  eventStartsAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
  venue: 'Laboratorio 3',
};

export function mockTickets(): TicketPage {
  return { items: [TICKET], nextCursor: null };
}

export function mockTicket(id: string): Ticket | undefined {
  return id === TICKET.id ? TICKET : TICKET;
}
