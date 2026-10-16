import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_MS,
  type MediaItem,
  type MediaKind,
} from '@/features/create/types';
import { newUuid } from '@/lib/ids';

export interface MediaSelection {
  error: string | null;
  pickImages: () => Promise<void>;
  pickVideo: () => Promise<void>;
  remove: (id: string) => void;
}

/**
 * Media selection for the composer (UC-05, RN-05.2): up to 4 images OR 1 video
 * from the library via `expo-image-picker`. Limits are validated on-device and
 * surfaced as i18n messages; the server re-validates.
 */
export function useMediaSelection({
  items,
  onChange,
}: {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}): MediaSelection {
  const { t } = useTranslation('create');
  const [error, setError] = useState<string | null>(null);

  const imageCount = items.filter((item) => item.kind === 'image').length;

  const toItem = (asset: ImagePicker.ImagePickerAsset, kind: MediaKind): MediaItem => ({
    id: asset.assetId ?? newUuid(),
    uri: asset.uri,
    kind,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType ?? undefined,
    fileSize: asset.fileSize,
    durationMs: asset.duration ?? undefined,
  });

  const ensurePermission = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t('media.permissionDenied'));
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    setError(null);
    if (!(await ensurePermission())) return;
    const remaining = MAX_IMAGES - imageCount;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      orderedSelection: true,
      quality: 1,
    });
    if (result.canceled) return;
    const accepted = result.assets.filter((asset) => (asset.fileSize ?? 0) <= MAX_IMAGE_BYTES);
    if (accepted.length < result.assets.length) setError(t('media.imageTooLarge'));
    if (result.assets.length > remaining) setError(t('media.imageLimit', { count: MAX_IMAGES }));
    onChange([...items, ...accepted.map((asset) => toItem(asset, 'image'))].slice(0, MAX_IMAGES));
  };

  const pickVideo = async () => {
    setError(null);
    if (!(await ensurePermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: MAX_VIDEO_DURATION_MS / 1000,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    if ((asset.duration ?? 0) > MAX_VIDEO_DURATION_MS) {
      setError(t('media.videoTooLong'));
      return;
    }
    if ((asset.fileSize ?? 0) > MAX_VIDEO_BYTES) {
      setError(t('media.videoTooLarge'));
      return;
    }
    onChange([toItem(asset, 'video')]);
  };

  const remove = (id: string) => {
    setError(null);
    onChange(items.filter((item) => item.id !== id));
  };

  return { error, pickImages, pickVideo, remove };
}
