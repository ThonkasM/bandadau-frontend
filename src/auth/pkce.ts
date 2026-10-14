import * as Crypto from 'expo-crypto';

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** base64url without padding (RN has no btoa/Buffer guarantee on native). */
function toBase64Url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] as number;
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += BASE64URL_ALPHABET[b0 >> 2];
    out += BASE64URL_ALPHABET[((b0 & 0x03) << 4) | ((b1 ?? 0) >> 4)];
    if (b1 === undefined) break;
    out += BASE64URL_ALPHABET[((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)];
    if (b2 === undefined) break;
    out += BASE64URL_ALPHABET[b2 & 0x3f];
  }
  return out;
}

export interface PkcePair {
  verifier: string;
  challenge: string;
  method: 'S256';
}

/** PKCE S256 pair (RU-03.2): verifier 32 bytes base64url, challenge = BASE64URL(SHA256). */
export async function createPkcePair(): Promise<PkcePair> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  const verifier = toBase64Url(bytes);
  const digestB64 = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  const challenge = digestB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return { verifier, challenge, method: 'S256' };
}
