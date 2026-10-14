import type { ticketing } from '@bandada/contracts-ts';

/** Ticket types aliased from `@bandada/contracts-ts` (openapi/ticketing). */
export type Ticket = ticketing.components['schemas']['Ticket'];
export type TicketStatus = Ticket['status'];

/** `GET /api/v1/tickets/me` → `{ items, nextCursor }`. */
export type TicketPage = ticketing.components['schemas']['CursorPageMeta'] & { items: Ticket[] };
