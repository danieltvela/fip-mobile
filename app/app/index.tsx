import { Redirect } from 'expo-router';
import { useSession } from '../src/session/SessionContext';

/**
 * Entry route of the protected area: with a persistent session the user
 * lands on their profile, otherwise the login screen is shown.
 */
export default function HomeScreen() {
  const { session, loading } = useSession();

  if (loading) return null;
  return <Redirect href={session === null ? '/login' : '/profile'} />;
}
