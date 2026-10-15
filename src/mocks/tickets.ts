import type { Ticket, TicketDetail, TicketPage } from '@/features/tickets/types';

const NOW = new Date().toISOString();
const USER_ID = '0192f3b0-0000-7000-8000-000000000001';

/** Mock JWS compact ES256 (`header.payload.signature`) — mirrors the contract's `qrPayload`. */
const QR_PAYLOAD = [
  'eyJhbGciOiJFUzI1NiIsImtpZCI6ImJhbmRhZGEtdGlja2V0LTIwMjYifQ',
  'eyJ0aWQiOiIwMTkyZjNlMC0wMDAwLTcwMDAtODAwMC0wMDAwMDAwMDAwYmIiLCJlaWQiOiIwMTkyZjNkMC0wMDAwLTcwMDAtODAwMC0wMDAwMDAwMDAwMDIiLCJyaWQiOiIwMTkyZjNkMC0wMDAwLTcwMDAtODAwMC0wMDAwMDAwMDAwYWEiLCJzdWIiOiIwMTkyZjNiMC0wMDAwLTcwMDAtODAwMC0wMDAwMDAwMDAwMDEiLCJpYXQiOjE3NjAwMDAwMDB9',
  'QnJhbmRhZGFNb2NrU2lnbmF0dXJlRVMyNTZfU2ZLS3h3UkpTTWVLS0YyUVQ0ZndwTWVKZjM2UE9rNnlKVl9hZFFzc3c1Yw',
].join('.');

const TICKETS: Ticket[] = [
  {
    id: '0192f3e0-0000-7000-8000-0000000000bb',
    eventId: '0192f3d0-0000-7000-8000-000000000002',
    userId: USER_ID,
    registrationId: '0192f3d0-0000-7000-8000-0000000000aa',
    status: 'ISSUED',
    issuedAt: NOW,
    usedAt: null,
    voidedAt: null,
    eventTitle: 'Taller de SAGA de inscripción',
    eventStartsAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
    venue: 'Laboratorio 3 · Bloque B',
  },
  {
    id: '0192f3e0-0000-7000-8000-0000000000cc',
    eventId: '0192f3d0-0000-7000-8000-000000000004',
    userId: USER_ID,
    registrationId: '0192f3d0-0000-7000-8000-0000000000ac',
    status: 'ISSUED',
    issuedAt: NOW,
    usedAt: null,
    voidedAt: null,
    eventTitle: 'Hackathon Bandada U',
    eventStartsAt: new Date(Date.now() + 12 * 86_400_000).toISOString(),
    venue: 'Auditorio Principal',
  },
  {
    id: '0192f3e0-0000-7000-8000-0000000000dd',
    eventId: '0192f3d0-0000-7000-8000-000000000001',
    userId: USER_ID,
    registrationId: '0192f3d0-0000-7000-8000-0000000000ab',
    status: 'USED',
    issuedAt: NOW,
    usedAt: NOW,
    voidedAt: null,
    eventTitle: 'Feria de Software 2026',
    eventStartsAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    venue: 'Patio Central',
  },
];

export function mockTickets(): TicketPage {
  return { items: TICKETS, nextCursor: null };
}

export function mockTicket(id: string): TicketDetail {
  const ticket = TICKETS.find((item) => item.id === id) ?? TICKETS[0]!;
  return { ...ticket, qrPayload: QR_PAYLOAD };
}
