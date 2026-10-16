/**
 * Native: a single JS context, so there are no concurrent refreshes to coordinate
 * (the access token lives in memory and the refresh token in the secure store).
 */
export function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  return task();
}
