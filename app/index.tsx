import { Redirect } from 'expo-router';

/**
 * Entry redirect. Until session restoration is implemented (Fase B), the app
 * opens the welcome screen; with a session it will go to the feed.
 */
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
