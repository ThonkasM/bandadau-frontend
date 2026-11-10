import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { apiRequest } from '@/lib/api-client';
import { useSessionStore } from '@/stores/session.store';

/**
 * UC-24: once authenticated, request permission and register the Expo push token with
 * notification-service. Best-effort (dev clients/emulators have no push token).
 */
export function usePushRegistration(): void {
  const status = useSessionStore((s) => s.status);
  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    void (async () => {
      try {
        const permission = await Notifications.requestPermissionsAsync();
        if (!permission.granted) return;
        const projectId =
          process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
          (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId;
        const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined))
          .data;
        if (cancelled) return;
        await apiRequest<void>(`/api/v1/devices/${token}`, {
          method: 'PUT',
          body: { platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID' },
        });
      } catch {
        // Dev client/emulator without push support.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);
}
