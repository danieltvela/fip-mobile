import { Link } from 'expo-router';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text>FIP Press</Text>
      <Link href="/press">Press room</Link>
      <StatusBar />
    </View>
  );
}
