import { useEffect } from 'react';

import { apiRequest } from '@/lib/api-client';
import { env } from '@/lib/env';
import { useSessionStore } from '@/stores/session.store';

import {
  base64UrlToUint8Array,
  buildRegisterBody,
  hashEndpoint,
  shouldRegisterWebPush,
} from './web-push';

/** Avoids re-subscribing on every render/remount within the same page load. */
let registeredForSession = false;

/**
 * UC-24 (web): once authenticated, subscribe to Web Push (VAPID) and register the subscription with
 * notification-service (`PUT /api/v1/devices/<sha256(endpoint)>`). Best-effort and non-blocking.
 */
export function usePushRegistration(): void {
  const status = useSessionStore((s) => s.status);
  useEffect(() => {
    if (status !== 'authenticated') {
      registeredForSession = false;
      return;
    }
    if (registeredForSession || typeof navigator === 'undefined') return;
    const supported = shouldRegisterWebPush({
      hasServiceWorker: 'serviceWorker' in navigator,
      hasPushManager: typeof window !== 'undefined' && 'PushManager' in window,
      hasNotification: typeof Notification !== 'undefined',
      permission: typeof Notification !== 'undefined' ? Notification.permission : undefined,
      vapidPublicKey: env.vapidPublicKey,
    });
    if (!supported) return;
    registeredForSession = true;
    let cancelled = false;
    void (async () => {
      try {
        if (Notification.permission === 'default') {
          const result = await Notification.requestPermission();
          if (result !== 'granted') {
            registeredForSession = false;
            return;
          }
        }
        // Reuse the app-shell SW registration, or register it (it is skipped in dev builds).
        const registration =
          (await navigator.serviceWorker.getRegistration('/')) ??
          (await navigator.serviceWorker.register('/sw.js'));
        await navigator.serviceWorker.ready;
        const subscription =
          (await registration.pushManager.getSubscription()) ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64UrlToUint8Array(env.vapidPublicKey),
          }));
        const body = buildRegisterBody(subscription.toJSON());
        if (!body || cancelled) return;
        const token = await hashEndpoint(body.webPushSubscription.endpoint);
        await apiRequest<void>(`/api/v1/devices/${token}`, { method: 'PUT', body });
      } catch {
        registeredForSession = false; // allow a retry on next auth change; never surface errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);
}
