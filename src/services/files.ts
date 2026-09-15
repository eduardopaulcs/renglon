import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Writes the content to a cache file and opens the system share sheet, to send it to another
 * app (Drive, mail, a chat). Saving to the phone itself is `saveTextFile`: most share sheets have
 * no "save to device" target.
 */
export async function shareTextFile(fileName: string, content: string, mimeType: string, dialogTitle: string) {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle });
}

/**
 * Lets the user pick a folder on the phone (Downloads, Documents, an SD card...) through the
 * Storage Access Framework and writes the file there. No storage permission is needed, because
 * the user grants access to that folder alone. Returns false if they cancel the picker.
 */
export async function saveTextFile(fileName: string, content: string, mimeType: string): Promise<boolean> {
  let directory: Directory;
  try {
    directory = await Directory.pickDirectoryAsync();
  } catch (error) {
    if (isPickerCancelled(error)) return false;
    throw error;
  }
  directory.createFile(fileName, mimeType).write(content);
  return true;
}

function isPickerCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (error as Error & { code?: string }).code === 'ERR_PICKER_CANCELLED' || /cancel/i.test(error.message);
}

/** Returns the text of a file chosen by the user, or null if they cancel the picker. */
export async function pickTextFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    // Many file managers report JSON files as text/plain or octet-stream, so filtering strictly
    // by application/json would hide valid backups.
    type: ['application/json', 'text/plain', 'application/octet-stream'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.length) return null;
  return new File(result.assets[0].uri).text();
}
