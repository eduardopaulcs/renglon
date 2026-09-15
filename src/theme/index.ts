import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

/**
 * Material 3 with a custom accent. Paper's themes are used as the base so the app looks
 * native on any manufacturer (Samsung, Motorola, etc.) instead of imposing its own look that
 * clashes with the system.
 */
const brand = {
  primary: '#3F6BD6',
  secondary: '#5A6478',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brand.primary,
    secondary: brand.secondary,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#A8C0FF',
    secondary: '#BFC6DC',
  },
};

export type AppTheme = typeof lightTheme;
