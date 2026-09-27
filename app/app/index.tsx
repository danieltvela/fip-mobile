import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FIP Press</Text>
      <Link href="/press" asChild>
        <View style={styles.link}>
          <Text style={styles.linkText}>Press room</Text>
        </View>
      </Link>
      <Link href="/press-room" asChild>
        <View style={styles.link}>
          <Text style={styles.linkText}>Press room search</Text>
        </View>
      </Link>
      <Link href="/agenda" asChild>
        <View style={styles.link}>
          <Text style={styles.linkText}>Agenda</Text>
        </View>
      </Link>
      <Link href="/credential" asChild>
        <View style={styles.link}>
          <Text style={styles.linkText}>Credential</Text>
        </View>
      </Link>
      <Link href="/notifications" asChild>
        <View style={styles.link}>
          <Text style={styles.linkText}>Notifications</Text>
        </View>
      </Link>
      <Link href="/gallery" asChild>
        <View style={styles.link}>
          <Text style={styles.linkText}>Media gallery</Text>
        </View>
      </Link>
      <StatusBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  link: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#1a3c8f' },
  linkText: { color: '#fff', fontWeight: '600' },
});
