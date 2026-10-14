/** Web: new tab without opener (no access to our window/context). */
export async function openHandoffUrl(url: string): Promise<void> {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener');
  }
}
