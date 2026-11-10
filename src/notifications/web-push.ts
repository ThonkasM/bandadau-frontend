/** Pure helpers for Web Push (VAPID) registration. No React / no globals except via injected args. */

/** Decodes a base64url string (VAPID public key) into bytes. */
export function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/** SHA-256 hex of the subscription endpoint: the `token` path segment for `platform: WEB`. */
export async function hashEndpoint(
  endpoint: string,
  subtle: Pick<SubtleCrypto, 'digest'> = globalThis.crypto.subtle,
): Promise<string> {
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export type PushSupport = {
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
  permission: NotificationPermission | undefined;
  vapidPublicKey: string;
};

/** Whether we should try to subscribe (supported, key configured and not denied). */
export function shouldRegisterWebPush(s: PushSupport): boolean {
  if (!s.vapidPublicKey) return false;
  if (!s.hasServiceWorker || !s.hasPushManager || !s.hasNotification) return false;
  return s.permission !== 'denied';
}

type SubscriptionJson = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

/** Builds the `RegisterDeviceRequest` body (contract: `webPushSubscription`). Null if incomplete. */
export function buildRegisterBody(
  json: SubscriptionJson,
): { platform: 'WEB'; webPushSubscription: { endpoint: string; keys: { p256dh: string; auth: string } } } | null {
  const { endpoint, keys } = json;
  if (!endpoint || !keys?.p256dh || !keys.auth) return null;
  return { platform: 'WEB', webPushSubscription: { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } } };
}
