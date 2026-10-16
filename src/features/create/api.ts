import type { media, social } from '@bandada/contracts-ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api-client';
import { ApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';

export type UploadTicket = media.components['schemas']['UploadTicket'];
export type MediaAsset = media.components['schemas']['MediaAsset'];
export type MediaStatus = MediaAsset['status'];
export type MediaKind = media.components['schemas']['MediaKind'];
export type PostVisibility = social.components['schemas']['PostVisibility'];
export type PublishedPost = social.components['schemas']['Post'];

export interface CreateUploadInput {
  kind: MediaKind;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
  fileName?: string;
}

/** UC-05: register a media asset and get a presigned S3 upload URL (♻️). */
export function useCreateUpload() {
  return useMutation<UploadTicket, Error, CreateUploadInput>({
    mutationFn: (input) =>
      apiRequest<UploadTicket>('/api/v1/media/uploads', {
        method: 'POST',
        body: { purpose: 'POST', ...input },
        idempotent: true,
      }),
  });
}

/** UC-05: confirm the upload finished (202 → PROCESSING). */
export function useCompleteUpload() {
  return useMutation<MediaAsset, Error, string>({
    mutationFn: (mediaId) =>
      apiRequest<MediaAsset>(`/api/v1/media/${mediaId}/complete`, { method: 'POST' }),
  });
}

/** UC-05: media asset status (polls while the pipeline is still processing). */
export function useMedia(mediaId: string | null | undefined) {
  return useQuery({
    queryKey: ['media', mediaId ?? ''],
    queryFn: () => apiRequest<MediaAsset>(`/api/v1/media/${mediaId}`),
    enabled: Boolean(mediaId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'PENDING_UPLOAD' || status === 'PROCESSING' ? 1000 : false;
    },
  });
}

/**
 * UC-05: PUT the file bytes to the presigned URL. Uses the same headers the signature
 * was computed with (they must not change).
 */
export async function uploadToPresignedUrl(ticket: UploadTicket, fileUri: string): Promise<void> {
  const file = await fetch(fileUri);
  const blob = await file.blob();
  const response = await fetch(ticket.uploadUrl, {
    method: ticket.uploadMethod,
    headers: ticket.uploadHeaders,
    body: blob,
  });
  if (!response.ok) throw new Error(`UPLOAD_FAILED_${response.status}`);
}

/** UC-05: create the post (♻️; `clientId` UUIDv7 dedupes offline retries). */
export function usePublishPost() {
  const client = useQueryClient();
  return useMutation<
    PublishedPost,
    Error,
    {
      clientId: string;
      text: string;
      mediaIds: string[];
      visibility: PostVisibility;
      groupId?: string;
      idempotencyKey: string;
    }
  >({
    mutationFn: ({ idempotencyKey, ...body }) =>
      apiRequest<PublishedPost>('/api/v1/posts', { method: 'POST', body, idempotencyKey }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.feed.root() }),
  });
}

const MODERATION_POLL_MS = 700;
const MODERATION_TIMEOUT_MS = 10_000;

/**
 * Waits (bounded) for moderation to finish. The server keeps a post `PENDING_MEDIA` — hidden from the
 * feed — until its media is approved, so publishing right after `complete` would leave the new post
 * missing from the feed we refetch immediately. A rejected asset fails fast with `MEDIA_REJECTED`;
 * if it is still processing at the deadline (e.g. video) we publish anyway and the server shows it later.
 */
async function waitForModeration(mediaId: string): Promise<void> {
  const deadline = Date.now() + MODERATION_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const asset = await apiRequest<MediaAsset>(`/api/v1/media/${mediaId}`);
    if (asset.status === 'APPROVED') return;
    if (asset.status === 'REJECTED') {
      throw new ApiError({
        type: 'about:blank',
        title: 'Media rejected',
        status: 422,
        code: 'MEDIA_REJECTED',
      });
    }
    await new Promise((resolve) => setTimeout(resolve, MODERATION_POLL_MS));
  }
}

/** Full UC-05 pipeline for one attachment: register → PUT → complete → wait for moderation. */
export async function uploadMedia(
  input: CreateUploadInput,
  fileUri: string,
  deps: {
    createUpload: (input: CreateUploadInput) => Promise<UploadTicket>;
    completeUpload: (mediaId: string) => Promise<MediaAsset>;
  },
): Promise<string> {
  const ticket = await deps.createUpload(input);
  await uploadToPresignedUrl(ticket, fileUri);
  await deps.completeUpload(ticket.mediaId);
  await waitForModeration(ticket.mediaId);
  return ticket.mediaId;
}
