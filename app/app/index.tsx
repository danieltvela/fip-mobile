import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FIP Press</Text>
      <Link href="/agenda" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkLabel}>Agenda</Text>
        </Pressable>
      </Link>
      <StatusBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  link: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1d4ed8',
  },
  linkLabel: { color: '#fff', fontWeight: '600' },
});
