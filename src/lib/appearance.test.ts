import { DEFAULT_FOLDER_ICON, FOLDER_ICONS, folderIcon, sanitizeFolderIcon, sanitizeTagColor } from './appearance';

describe('folder icons', () => {
  it('offers the default icon among the choices', () => {
    expect(FOLDER_ICONS).toContain(DEFAULT_FOLDER_ICON);
  });

  it('keeps known icons and drops anything else', () => {
    expect(sanitizeFolderIcon('home-outline')).toBe('home-outline');
    expect(sanitizeFolderIcon('rocket')).toBeNull();
    expect(sanitizeFolderIcon(null)).toBeNull();
  });

  it('draws the default icon when a folder has none or an unknown one', () => {
    expect(folderIcon(null)).toBe(DEFAULT_FOLDER_ICON);
    expect(folderIcon('rocket')).toBe(DEFAULT_FOLDER_ICON);
    expect(folderIcon('cash')).toBe('cash');
  });
});

describe('sanitizeTagColor', () => {
  it('keeps palette keys and drops raw colors', () => {
    expect(sanitizeTagColor('teal')).toBe('teal');
    expect(sanitizeTagColor('#FF0000')).toBeNull();
    expect(sanitizeTagColor(null)).toBeNull();
  });
});
