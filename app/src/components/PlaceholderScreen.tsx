import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/theme';

type Props = {
  title: string;
  subtitle: string;
};

export function PlaceholderScreen({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 8,
  },
  title: {
    fontSize: typography.sizes.heading,
    fontFamily: typography.fontFamilyBold,
    color: colors.primary,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamilyRegular,
    color: colors.textSecondary,
  },
});
