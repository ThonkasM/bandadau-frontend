import {
  base64UrlToUint8Array,
  buildRegisterBody,
  hashEndpoint,
  shouldRegisterWebPush,
} from './web-push';

const base = {
  hasServiceWorker: true,
  hasPushManager: true,
  hasNotification: true,
  permission: 'default' as NotificationPermission,
  vapidPublicKey: 'abc',
};

describe('base64UrlToUint8Array', () => {
  it('decodes url-safe base64 without padding', () => {
    expect(Array.from(base64UrlToUint8Array('-_8'))).toEqual([251, 255]);
    expect(Array.from(base64UrlToUint8Array('SGk'))).toEqual([72, 105]);
  });
});

describe('hashEndpoint', () => {
  it('returns the SHA-256 hex of the endpoint', async () => {
    const hash = await hashEndpoint('abc', globalThis.crypto.subtle);
    expect(hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('shouldRegisterWebPush', () => {
  it('requires the VAPID key', () => {
    expect(shouldRegisterWebPush({ ...base, vapidPublicKey: '' })).toBe(false);
  });
  it('requires browser support', () => {
    expect(shouldRegisterWebPush({ ...base, hasPushManager: false })).toBe(false);
    expect(shouldRegisterWebPush({ ...base, hasServiceWorker: false })).toBe(false);
    expect(shouldRegisterWebPush({ ...base, hasNotification: false })).toBe(false);
  });
  it('respects a denied permission', () => {
    expect(shouldRegisterWebPush({ ...base, permission: 'denied' })).toBe(false);
  });
  it('allows default and granted', () => {
    expect(shouldRegisterWebPush(base)).toBe(true);
    expect(shouldRegisterWebPush({ ...base, permission: 'granted' })).toBe(true);
  });
});

describe('buildRegisterBody', () => {
  it('maps a PushSubscription JSON to the contract body', () => {
    expect(buildRegisterBody({ endpoint: 'https://p/x', keys: { p256dh: 'k', auth: 'a' } })).toEqual({
      platform: 'WEB',
      webPushSubscription: { endpoint: 'https://p/x', keys: { p256dh: 'k', auth: 'a' } },
    });
  });
  it('returns null when incomplete', () => {
    expect(buildRegisterBody({ endpoint: 'https://p/x' })).toBeNull();
  });
});
