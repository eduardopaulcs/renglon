import { Storage } from 'expo-sqlite/kv-store';
import { useState } from 'react';

export type TipId = 'folderIcon' | 'tagColor' | 'listGestures' | 'editorMarkdown';

const keyFor = (id: TipId) => `tip.${id}.seen`;

/**
 * A hint shown until the user dismisses it or uses the feature it describes.
 *
 * Whether a tip was seen lives in expo-sqlite's key-value store, a file separate from the notes
 * database: it is state of this device, so backups and schema migrations never touch it.
 */
export function useTip(id: TipId) {
  const [seen, setSeen] = useState(() => Storage.getItemSync(keyFor(id)) === '1');

  const dismiss = () => {
    if (seen) return;
    Storage.setItemSync(keyFor(id), '1');
    setSeen(true);
  };

  return { visible: !seen, dismiss };
}
