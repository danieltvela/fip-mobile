import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import { colors, typography } from '@/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FIP Press</Text>
      <Link href="/press" asChild>
        <View style={styles.link}>
          <Text style={styles.linkText}>Press room</Text>
        </View>
      </Link>
      <Link href="/credential" asChild>
        <View style={styles.link}>
          <Text style={styles.linkText}>My credential</Text>
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
  title: { fontSize: typography.sizes.heading, fontWeight: '700' },
  link: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  linkText: { color: colors.textOnPrimary, fontWeight: '600' },
});
