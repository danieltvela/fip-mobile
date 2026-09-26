import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { colors, typography } from '@/theme';

const TAB_BAR_HEIGHT = 56;

const styles = StyleSheet.create({
  tabBar: {
    height: TAB_BAR_HEIGHT,
    backgroundColor: colors.primaryDark,
    borderTopColor: colors.border,
  },
  tabBarLabel: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyMedium,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
      }}
    >
      <Tabs.Screen name="press" options={{ title: 'Press' }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="credential" options={{ title: 'Credential' }} />
      <Tabs.Screen name="contact" options={{ title: 'Contact' }} />
    </Tabs>
  );
}
