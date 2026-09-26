import { Link } from 'expo-router';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>FIP Press</Text>
      <Link href="/credential">My credential</Link>
      <StatusBar />
    </View>
  );
}
