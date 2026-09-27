import { View, Text, StyleSheet } from 'react-native';
import { useCredential } from '../lib/credential';
import { CredentialCard } from '../components/CredentialCard';

/**
 * Digital press credential screen (#14).
 * Visible only once on-site accreditation activates the credential.
 */
export default function CredentialScreen() {
  const credential = useCredential();

  if (!credential.activated) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.lockedTitle}>Credential not activated</Text>
        <Text style={styles.lockedBody}>
          Your digital press credential will appear here once on-site
          accreditation is completed.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.center]}>
      <CredentialCard credential={credential} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f1f5f9' },
  center: { alignItems: 'center', justifyContent: 'center' },
  lockedTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  lockedBody: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingHorizontal: 24 },
});
