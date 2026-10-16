/** Web: register the app-shell service worker (PWA) in production builds only. */
export function registerServiceWorker(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (__DEV__) return;
  const register = () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  };
  // The React effect may run after `load` already fired, so handle both cases.
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
