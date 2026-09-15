/**
 * The choices offered for folder icons and tag colors.
 *
 * The database stores these keys, never raw icon names or hex values: the theme decides what a
 * color looks like in light and dark mode, and anything read from an imported backup is checked
 * against these lists before it is written.
 */

export const FOLDER_ICONS = [
  'folder-outline',
  'briefcase-outline',
  'home-outline',
  'school-outline',
  'book-open-variant',
  'lightbulb-outline',
  'heart-outline',
  'star-outline',
  'cart-outline',
  'cash',
  'calendar-blank-outline',
  'account-group-outline',
  'airplane',
  'food-fork-drink',
  'dumbbell',
  'music-note',
  'palette-outline',
  'code-braces',
  'flask-outline',
  'archive-outline',
] as const;

export type FolderIcon = (typeof FOLDER_ICONS)[number];

export const DEFAULT_FOLDER_ICON: FolderIcon = 'folder-outline';

export const TAG_COLORS = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'brown', 'gray'] as const;

export type TagColor = (typeof TAG_COLORS)[number];

/** Unknown values become null rather than an error, so a backup from a newer version still imports. */
export function sanitizeFolderIcon(icon: string | null): FolderIcon | null {
  return icon !== null && (FOLDER_ICONS as readonly string[]).includes(icon) ? (icon as FolderIcon) : null;
}

export function sanitizeTagColor(color: string | null): TagColor | null {
  return color !== null && (TAG_COLORS as readonly string[]).includes(color) ? (color as TagColor) : null;
}

/** The icon to draw for a folder: its own, or the default one. */
export function folderIcon(icon: string | null): FolderIcon {
  return sanitizeFolderIcon(icon) ?? DEFAULT_FOLDER_ICON;
}
