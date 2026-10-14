import * as WebBrowser from 'expo-web-browser';

/** Native: in-app browser (SFSafariViewController / Custom Tabs). */
export async function openHandoffUrl(url: string): Promise<void> {
  await WebBrowser.openBrowserAsync(url);
}
