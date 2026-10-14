import { Redirect } from 'expo-router';

/** Cold start always lands on Welcome; entering (login/register/guest) goes to the feed. */
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
