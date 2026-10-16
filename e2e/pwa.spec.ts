import { expect, test } from '@playwright/test';

/** PWA checks for the exported web build (RNF-10: installable, SW, model not precached). */
test.describe('PWA', () => {
  test('ships an installable web manifest', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    expect(res.ok()).toBeTruthy();
    const manifest = await res.json();
    expect(manifest.name).toBe('Bandada U');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('registers a service worker', async ({ page }) => {
    await page.goto('/');
    await expect
      .poll(async () =>
        page.evaluate(async () => {
          if (!('serviceWorker' in navigator)) return false;
          const reg = await navigator.serviceWorker.getRegistration();
          return Boolean(reg);
        }),
      )
      .toBe(true);
  });

  test('renders the welcome screen with the login entry', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Bienvenido a Bandada U')).toBeVisible();
    await expect(page.getByText('Iniciar sesión').first()).toBeVisible();
  });
});
