/** With `expo/fetch` a cancellation does not throw a classic `AbortError` (SDK 57). */
export function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'AbortError' || /abort/i.test(error.message);
  }
  return false;
}
