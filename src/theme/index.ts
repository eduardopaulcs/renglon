import { DarkTheme as NavigationDark, DefaultTheme as NavigationLight } from 'expo-router';
import { Platform } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, useTheme } from 'react-native-paper';

import { sanitizeTagColor, type TagColor } from '@/lib/appearance';

export interface TagSwatch {
  /** Chip background. */
  container: string;
  /** Text on the chip. */
  onContainer: string;
  /** Solid color for small marks: dots, drawer icons, swatches. */
  dot: string;
}

// Muted like the rest of the palette, so colored tags read as ink on paper rather than stickers.
const lightTagColors: Record<TagColor, TagSwatch> = {
  red: { container: '#F6D5D0', onContainer: '#6B1E14', dot: '#C8553D' },
  orange: { container: '#F8DEC4', onContainer: '#6A3510', dot: '#D9822B' },
  yellow: { container: '#F3E7B3', onContainer: '#5A4A0E', dot: '#C9A227' },
  green: { container: '#D6E8CF', onContainer: '#23461B', dot: '#5B8C4A' },
  teal: { container: '#CFE7E3', onContainer: '#14453F', dot: '#3F8F85' },
  blue: { container: '#D6E2F2', onContainer: '#0E2340', dot: '#3E6BA8' },
  purple: { container: '#E3D8EE', onContainer: '#3B2257', dot: '#7E5AA6' },
  pink: { container: '#F4D6E3', onContainer: '#5E1B3A', dot: '#C0568A' },
  brown: { container: '#E6D6C6', onContainer: '#4A3020', dot: '#8C6446' },
  gray: { container: '#E2DED6', onContainer: '#3A3832', dot: '#8A857A' },
};

const darkTagColors: Record<TagColor, TagSwatch> = {
  red: { container: '#5A2A22', onContainer: '#F6D5D0', dot: '#E08A73' },
  orange: { container: '#5A3A1E', onContainer: '#F8DEC4', dot: '#E8A15C' },
  yellow: { container: '#4E4418', onContainer: '#F3E7B3', dot: '#D9BC52' },
  green: { container: '#2F4529', onContainer: '#D6E8CF', dot: '#8DBB7A' },
  teal: { container: '#1F4642', onContainer: '#CFE7E3', dot: '#6FBDB2' },
  blue: { container: '#2C4466', onContainer: '#D6E2F2', dot: '#8FB0DC' },
  purple: { container: '#40305A', onContainer: '#E3D8EE', dot: '#B394D6' },
  pink: { container: '#582740', onContainer: '#F4D6E3', dot: '#E08AB5' },
  brown: { container: '#4A3828', onContainer: '#E6D6C6', dot: '#C49A78' },
  gray: { container: '#3C3A34', onContainer: '#E2DED6', dot: '#B3AD9F' },
};

/**
 * "Notebook" palette: cream paper, navy ink for primary actions and a margin red as the accent.
 * The name of the app is a ruled line, so the editor draws them; `notebook` holds the colors
 * that Material has no slot for.
 */
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1F3A5F',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D6E2F2',
    onPrimaryContainer: '#0E2340',
    secondary: '#6B5E4A',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#EDE3D1',
    onSecondaryContainer: '#3B3222',
    tertiary: '#C8553D',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#F6D9D1',
    onTertiaryContainer: '#5C1F12',
    background: '#F7F1E3',
    onBackground: '#2A2620',
    surface: '#FFFBF2',
    onSurface: '#2A2620',
    surfaceVariant: '#EFE6D4',
    onSurfaceVariant: '#6F6553',
    outline: '#B9AC93',
    outlineVariant: '#E4D8C0',
    inverseSurface: '#34302A',
    inverseOnSurface: '#F7F1E3',
    inversePrimary: '#9DB8DB',
    elevation: {
      level0: 'transparent',
      level1: '#FBF6EA',
      level2: '#F9F2E3',
      level3: '#F6EEDC',
      level4: '#F4EBD7',
      level5: '#F2E8D2',
    },
  },
  notebook: {
    ruleLine: '#E4D8C0',
    marginLine: '#E9B9AB',
  },
  tagColors: lightTagColors,
};

export type AppTheme = typeof lightTheme;

export const darkTheme: AppTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#9DB8DB',
    onPrimary: '#0E2340',
    primaryContainer: '#2C4466',
    onPrimaryContainer: '#D6E2F2',
    secondary: '#CFC2AB',
    onSecondary: '#352C1D',
    secondaryContainer: '#4A4133',
    onSecondaryContainer: '#EDE3D1',
    tertiary: '#E08A73',
    onTertiary: '#4A160A',
    tertiaryContainer: '#6E2E1F',
    onTertiaryContainer: '#F6D9D1',
    background: '#1B1A17',
    onBackground: '#E8DCC4',
    surface: '#26241F',
    onSurface: '#E8DCC4',
    surfaceVariant: '#34312A',
    onSurfaceVariant: '#B8AC95',
    outline: '#7D7361',
    outlineVariant: '#3A362E',
    inverseSurface: '#E8DCC4',
    inverseOnSurface: '#26241F',
    inversePrimary: '#1F3A5F',
    elevation: {
      level0: 'transparent',
      level1: '#23211D',
      level2: '#282621',
      level3: '#2D2A24',
      level4: '#2F2C26',
      level5: '#322F28',
    },
  },
  notebook: {
    ruleLine: '#3A362E',
    marginLine: '#6E3B30',
  },
  tagColors: darkTagColors,
};

export const useAppTheme = () => useTheme<AppTheme>();

/** Colors for a tag; tags without a color use the neutral secondary container. */
export function tagColors(theme: AppTheme, color: string | null): TagSwatch {
  const key = sanitizeTagColor(color);
  if (key) return theme.tagColors[key];
  return {
    container: theme.colors.secondaryContainer,
    onContainer: theme.colors.onSecondaryContainer,
    dot: theme.colors.outline,
  };
}

/** Serif for titles gives the notebook feel; Android ships Noto Serif, so nothing is bundled. */
export const titleFont = Platform.select({ ios: 'Georgia', default: 'serif' });

/** Keeps react-navigation's own surfaces (drawer, transitions) from flashing its default white. */
export function navigationThemeFor(theme: AppTheme, dark: boolean) {
  const base = dark ? NavigationDark : NavigationLight;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
    },
  };
}
