import type { ticketing } from '@bandada/contracts-ts';

/** Ticket types aliased from `@bandada/contracts-ts` (openapi/ticketing). */
export type Ticket = ticketing.components['schemas']['Ticket'];
export type TicketStatus = Ticket['status'];
/** `GET /tickets/{ticketId}` → Ticket + signed `qrPayload` (JWS) for the QR. */
export type TicketDetail = ticketing.components['schemas']['TicketDetail'];

/** `GET /api/v1/tickets/me` → `{ items, nextCursor }`. */
export type TicketPage = ticketing.components['schemas']['CursorPageMeta'] & { items: Ticket[] };
