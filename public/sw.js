// Bandada U — app shell service worker (PWA offline shell).
// Network-first with cache fallback; caches the shell + static assets on the fly.
const CACHE = 'bandada-shell-v1';
const SHELL = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
  );
});

// --- Web Push (VAPID) ---
// Payload from notification-service WebPushSender: { title, body, data: { deepLink?, ... } }
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }
  const data = payload.data && typeof payload.data === 'object' ? payload.data : {};
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Bandada U', {
      body: payload.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let target = self.location.origin + '/';
  try {
    const url = new URL(data.deepLink || data.url || '/', self.location.origin);
    // Keep only path/query/hash so the link always opens inside this origin.
    target = self.location.origin + url.pathname + url.search + url.hash;
  } catch {
    // keep default
  }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          return client.focus().then((focused) => (focused && 'navigate' in focused ? focused.navigate(target) : focused));
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
