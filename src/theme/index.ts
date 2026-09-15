import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

/**
 * Material 3 con un acento propio. Se usan los temas de Paper como base para
 * que la app se vea nativa en cualquier fabricante (Samsung, Motorola, etc.)
 * en lugar de imponer un look propio que desentone con el sistema.
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
