import type { events } from '@bandada/contracts-ts';

/** Event types aliased from `@bandada/contracts-ts` (openapi/events). */
export type Event = events.components['schemas']['Event'];
export type EventStatus = Event['status'];
export type Registration = events.components['schemas']['Registration'];
export type RegistrationStatus = Registration['status'];

/** `GET /api/v1/events` → `{ items, nextCursor }`. */
export type EventPage = events.components['schemas']['CursorPageMeta'] & { items: Event[] };
