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

/** Longest side (px) and JPEG quality for post images: sharp on any phone at ~300–500 KB. */
export const POST_IMAGE_MAX_SIDE = 1600;
export const POST_IMAGE_QUALITY = 0.8;

/** GIFs are kept as-is (re-encoding to JPEG would drop the animation). */
const KEEP_AS_IS = /^image\/gif$/i;

/** True when the image should be re-encoded to JPEG before upload (e.g. iPhone HEIC). */
export function needsJpegConversion(mimeType: string | undefined, uri: string): boolean {
  if (mimeType) return !PROCESSABLE_MIME.test(mimeType);
  return NON_PROCESSABLE_EXTENSION.test(uri);
}

/** True when a post image should be downscaled/recompressed (everything except GIF). */
export function needsCompression(mimeType: string | undefined): boolean {
  return !(mimeType && KEEP_AS_IS.test(mimeType));
}

/**
 * Re-encodes any decodable image (HEIC/HEIF, PNG, WebP…) to JPEG on-device, downscaling so the
 * longest side is at most `maxSide` (never upscales). Orientation (EXIF) is applied by the codec.
 * Throws when the platform cannot decode it.
 */
export async function toJpeg(
  uri: string,
  options: { compress?: number; maxSide?: number; width?: number; height?: number } = {},
): Promise<JpegImage> {
  const { compress = POST_IMAGE_QUALITY, maxSide = POST_IMAGE_MAX_SIDE, width, height } = options;
  const context = ImageManipulator.manipulate(uri);
  if (width && height && Math.max(width, height) > maxSide) {
    context.resize(width >= height ? { width: maxSide } : { height: maxSide });
  }
  const rendered = await context.renderAsync();
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
