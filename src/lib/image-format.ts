import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

/**
 * Image formats every target can render/process: browsers (feed/PWA) and the server thumbnailer
 * (`sharp`/JPEG). Anything else — notably the HEIC/HEIF photos iPhones produce — must be re-encoded
 * before upload, or the feed shows a broken image (`Content-Type: image/heic` is not browser-safe).
 */
const PROCESSABLE_MIME = /^image\/(?:jpe?g|png|webp|gif|avif|bmp|tiff)$/i;
const NON_PROCESSABLE_EXTENSION = /\.(?:heic|heif)$/i;

export interface JpegImage {
  uri: string;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  fileSize?: number;
}

/** True when the image should be re-encoded to JPEG before upload (e.g. iPhone HEIC). */
export function needsJpegConversion(mimeType: string | undefined, uri: string): boolean {
  if (mimeType) return !PROCESSABLE_MIME.test(mimeType);
  return NON_PROCESSABLE_EXTENSION.test(uri);
}

/** Re-encodes any decodable image to JPEG on-device. Throws when the platform cannot decode it. */
export async function toJpeg(uri: string, compress = 0.9): Promise<JpegImage> {
  const rendered = await ImageManipulator.manipulate(uri).renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress });
  return {
    uri: saved.uri,
    mimeType: 'image/jpeg',
    width: saved.width,
    height: saved.height,
    fileSize: await byteSize(saved.uri),
  };
}

/** Best-effort size in bytes of a local file/blob URI (native `File` / web `Blob`). */
export async function byteSize(uri: string): Promise<number | undefined> {
  if (Platform.OS === 'web') {
    try {
      return (await (await fetch(uri)).blob()).size;
    } catch {
      return undefined;
    }
  }
  try {
    const { File } = await import('expo-file-system');
    const size = new File(uri).size;
    return typeof size === 'number' ? size : undefined;
  } catch {
    return undefined;
  }
}
