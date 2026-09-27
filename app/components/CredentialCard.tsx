import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import type { Credential } from '../lib/credential';

/**
 * Pure presentation for an activated credential. Exported so the gating
 * behavior can be tested without native modules.
 */
export function CredentialCard({ credential }: { credential: Credential }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Press credential</Text>
      <View style={styles.qrWrap}>
        <QRCode value={credential.locatorCode} size={220} />
      </View>
      <Text style={styles.code}>{credential.locatorCode}</Text>
      <Text style={styles.name}>{credential.fullName}</Text>
      <Text style={styles.outlet}>{credential.outlet}</Text>
      <Text style={styles.legal}>
        This digital credential does not replace the physical credential. Carry
        your physical credential at all times.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    gap: 8,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' },
  qrWrap: { padding: 12, backgroundColor: '#ffffff', borderRadius: 8 },
  code: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: 2 },
  name: { fontSize: 18, fontWeight: '600' },
  outlet: { fontSize: 15, color: '#475569' },
  legal: { marginTop: 8, fontSize: 12, color: '#94a3b8', textAlign: 'center' },
});
