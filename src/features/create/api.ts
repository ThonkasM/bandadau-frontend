import type { media, social } from '@bandada/contracts-ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api-client';
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
    { clientId: string; text: string; mediaIds: string[]; visibility: PostVisibility; groupId?: string }
  >({
    mutationFn: (input) =>
      apiRequest<PublishedPost>('/api/v1/posts', { method: 'POST', body: input, idempotent: true }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.feed.root() }),
  });
}

/** Full UC-05 pipeline for one attachment: register → PUT → complete. */
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
  return ticket.mediaId;
}
