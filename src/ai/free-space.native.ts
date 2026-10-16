import { Paths } from 'expo-file-system';

/** Native: free bytes on the app's data volume (`expo-file-system` SDK 54+ `Paths`). */
export async function availableBytes(): Promise<number | null> {
  try {
    return Paths.availableDiskSpace;
  } catch {
    return null;
  }
}
