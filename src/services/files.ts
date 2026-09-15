import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Writes the content to a cache file and opens the system share sheet. Sharing a file (rather
 * than plain text) lets the user save it to Drive, Files or any app that accepts documents,
 * which is the whole point of a backup without a backend.
 */
export async function shareTextFile(fileName: string, content: string, mimeType: string, dialogTitle: string) {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle });
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
