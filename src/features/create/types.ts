export type Visibility = 'PUBLIC' | 'FOLLOWERS' | 'GROUP';

export type MediaKind = 'image' | 'video';

/** A media attachment selected in the composer (before it is uploaded). */
export interface MediaItem {
  id: string;
  uri: string;
  kind: MediaKind;
  width: number;
  height: number;
  mimeType?: string;
  fileSize?: number;
  durationMs?: number;
}

/** RN-05.2 — hasta 4 imágenes (≤10 MB c/u) o 1 video (≤60 s, ≤50 MB). */
export const MAX_IMAGES = 4;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_DURATION_MS = 60_000;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_TEXT_LENGTH = 2000;
