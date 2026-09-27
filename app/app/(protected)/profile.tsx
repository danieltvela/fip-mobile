import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, Link, useRouter } from 'expo-router';
import { apiLogout } from '../../src/lib/api';
import { useSession } from '../../src/session/SessionContext';

/**
 * Journalist profile: name, outlet and role, plus logout. This route is
 * protected — without a session the user is redirected to the login screen.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { session, loading, signOut } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  if (loading) return <Loading />;
  if (session === null) return <Redirect href="/login" />;

  const currentSession = session;

  async function onLogout() {
    setLoggingOut(true);
    try {
      await apiLogout(currentSession.accessToken);
    } catch {
      // Local sign-out proceeds even if the server is unreachable.
    }
    await signOut();
    router.replace('/login');
  }

  const journalist = session.journalist;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your profile</Text>
      <View style={styles.identityCard}>
        <Text style={styles.journalistName}>{journalist.name}</Text>
        <Field label="Outlet" value={journalist.outlet} />
        <Field label="Role" value={journalist.role} />
        <Field label="Credential" value={journalist.credentialNumber.replace(/(\d{4})(?=\d)/g, '$1 ')} />
      </View>
      <Link href="/gallery" asChild accessibilityRole="button" accessibilityLabel="Media gallery">
        <Pressable style={({ pressed }) => [styles.galleryButton, pressed && styles.buttonPressed]}>
          <Text style={styles.galleryText}>Media gallery</Text>
        </Pressable>
      </Link>
      <Pressable
        style={({ pressed }) => [styles.logoutButton, (pressed || loggingOut) && styles.buttonPressed]}
        onPress={onLogout}
        disabled={loggingOut}
        accessibilityRole="button"
        accessibilityLabel="Log out"
      >
        {loggingOut ? <ActivityIndicator color="#fff" /> : <Text style={styles.logoutText}>Log out</Text>}
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function Loading() {
  return (
    <View style={[styles.container, styles.loading]}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#10151c' },
  content: { padding: 24, paddingTop: 64, gap: 16 },
  loading: { justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  identityCard: { backgroundColor: '#1a222c', borderRadius: 12, padding: 16, gap: 14 },
  journalistName: { fontSize: 20, fontWeight: '600', color: '#ffffff' },
  field: { gap: 2 },
  fieldLabel: { fontSize: 12, color: '#9aa7b5', textTransform: 'uppercase' },
  fieldValue: { fontSize: 16, color: '#ffffff' },
  galleryButton: { backgroundColor: '#1a3c8f', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  galleryText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  logoutButton: { backgroundColor: '#b3403f', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  buttonPressed: { opacity: 0.75 },
  logoutText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
