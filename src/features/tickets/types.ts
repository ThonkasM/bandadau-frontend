import type { ticketing } from '@bandada/contracts-ts';

/** Ticket types aliased from `@bandada/contracts-ts` (openapi/ticketing). */
export type Ticket = ticketing.components['schemas']['Ticket'];
export type TicketStatus = Ticket['status'];
/** `GET /tickets/me?sort=` — `eventDate` (closest event first) or `recent` (latest acquisition first). */
export type TicketSort = 'eventDate' | 'recent';
/** `GET /tickets/{ticketId}` → Ticket + signed `qrPayload` (JWS) for the QR. */
export type TicketDetail = ticketing.components['schemas']['TicketDetail'];
/** `POST /tickets/validate` → result + the validated ticket (UC-14). */
export type ValidateTicketResponse = ticketing.components['schemas']['ValidateTicketResponse'];

/** `GET /api/v1/tickets/me` → `{ items, nextCursor }`. */
export type TicketPage = ticketing.components['schemas']['CursorPageMeta'] & { items: Ticket[] };
