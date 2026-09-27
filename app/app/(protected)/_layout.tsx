import { Redirect, Stack } from 'expo-router';
import { useSession } from '../../src/session/SessionContext';

/**
 * Route group layout guarding every authenticated screen (profile,
 * gallery). When there is no session the login screen is shown instead of
 * the protected content, regardless of which protected route is visited.
 */
export default function ProtectedLayout() {
  const { session, loading } = useSession();

  if (loading) return null;
  if (session === null) return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
