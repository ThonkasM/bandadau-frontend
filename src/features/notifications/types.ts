import type { notification } from '@bandada/contracts-ts';

/** Notification types aliased from `@bandada/contracts-ts` (openapi/notification). */
export type AppNotification = notification.components['schemas']['Notification'];
export type NotificationType = AppNotification['type'];
export type DevicePlatform = notification.components['schemas']['DevicePlatform'];
export type NotificationPreferences = notification.components['schemas']['NotificationPreferences'];

/** `GET /api/v1/notifications` → `{ items, nextCursor }`. */
export type NotificationPage = notification.components['schemas']['CursorPageMeta'] & {
  items: AppNotification[];
};
