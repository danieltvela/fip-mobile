/**
 * Centralized visual theme for the FIP mobile app.
 * Single source of truth for colors and typography.
 */

export const colors = {
  // Primary brand palette
  primary: '#1B3A5C',
  primaryDark: '#12283F',
  accent: '#C8A24B',

  // Backgrounds / surfaces
  background: '#FFFFFF',
  surface: '#F5F6F8',
  border: '#D9DDE3',

  // Text
  text: '#1A1A1A',
  textSecondary: '#5A6572',
  textOnPrimary: '#FFFFFF',

  // Tab bar
  tabBarActive: '#C8A24B',
  tabBarInactive: '#8A94A0',
} as const;

export const typography = {
  fontFamilyRegular: 'System',
  fontFamilyMedium: 'System',
  fontFamilyBold: 'System',

  sizes: {
    heading: 24,
    body: 16,
    caption: 13,
  },
} as const;

export type Theme = typeof colors;
