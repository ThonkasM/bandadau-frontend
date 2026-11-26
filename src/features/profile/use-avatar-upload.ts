import { useQueryClient } from '@tanstack/react-query';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

import {
  type CreateUploadInput,
  uploadMedia,
  useCompleteUpload,
  useCreateUpload,
} from '@/features/create/api';
import { isApiErrorWithCode } from '@/lib/api-error';
import { byteSize } from '@/lib/image-format';
import { queryKeys } from '@/lib/query-keys';

import { useUpdateProfile } from './api';

/** Avatars are shown at most ~120 px; 320 px is sharp on 2–3x screens at ~15–25 KB (slow networks). */
const AVATAR_SIZE = 320;
const AVATAR_QUALITY = 0.8;

export type AvatarUploadError = 'rejected' | 'failed' | null;

/**
 * UC-04: change the profile photo. Expo's recommended pattern: the system photo picker (no
 * permission prompt) with the native square crop (`allowsEditing`), then resize to a small JPEG
 * on-device, upload through the media pipeline (`purpose: AVATAR`: register → PUT → complete →
 * moderation) and finally point the profile at the new media (`PATCH /profiles/me`).
 * While moderation is pending the server keeps the previous avatar (`avatarStatus: PENDING`).
 */
export function useAvatarUpload() {
  const client = useQueryClient();
  const createUpload = useCreateUpload();
  const completeUpload = useCompleteUpload();
  const updateProfile = useUpdateProfile();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<AvatarUploadError>(null);

  const pickAvatar = useCallback(async () => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;

    setUploading(true);
    setProgress(0);
    try {
      // Square crop → fixed size → JPEG (also converts iPhone HEIC).
      const rendered = await ImageManipulator.manipulate(asset.uri)
        .resize({ width: AVATAR_SIZE, height: AVATAR_SIZE })
        .renderAsync();
      const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: AVATAR_QUALITY });
      const sizeBytes = (await byteSize(saved.uri)) ?? asset.fileSize ?? 0;

      const input: CreateUploadInput = {
        purpose: 'AVATAR',
        kind: 'IMAGE',
        mimeType: 'image/jpeg',
        sizeBytes,
        fileName: 'avatar.jpg',
      };
      const mediaId = await uploadMedia(
        input,
        saved.uri,
        {
          createUpload: (body) => createUpload.mutateAsync(body),
          completeUpload: (id) => completeUpload.mutateAsync(id),
        },
        setProgress,
      );
      await updateProfile.mutateAsync({ avatarMediaId: mediaId });
      // The author's photo appears in posts and other profiles too.
      await client.invalidateQueries({ queryKey: queryKeys.profile.root() });
      await client.invalidateQueries({ queryKey: queryKeys.feed.root() });
    } catch (cause) {
      setError(
        isApiErrorWithCode(cause, 'MEDIA_REJECTED') || isApiErrorWithCode(cause, 'MEDIA_NOT_APPROVED')
          ? 'rejected'
          : 'failed',
      );
    } finally {
      setUploading(false);
    }
  }, [client, completeUpload, createUpload, updateProfile]);

  return { pickAvatar, uploading, progress, error, clearError: () => setError(null) };
}
