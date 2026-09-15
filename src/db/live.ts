import { addDatabaseChangeListener } from 'expo-sqlite';
import { type DependencyList, useEffect, useRef, useState } from 'react';

export type TableName = 'notes' | 'folders' | 'tags' | 'note_tags';

/**
 * Runs a query and re-runs it whenever any of the given tables changes.
 *
 * Drizzle's useLiveQuery only watches the main table of a query, so a note list that shows
 * tags would go stale when a tag is renamed. Listening to every table the screen depends on
 * fixes that. It relies on `enableChangeListener` in src/db/client.ts.
 */
export function useLiveData<T>(
  fetch: () => T | Promise<T>,
  tables: readonly TableName[],
  deps: DependencyList
): T | undefined {
  const [data, setData] = useState<T>();
  const fetchRef = useRef(fetch);

  useEffect(() => {
    fetchRef.current = fetch;
  });

  useEffect(() => {
    let cancelled = false;
    let scheduled = false;

    const run = async () => {
      scheduled = false;
      const result = await fetchRef.current();
      if (!cancelled) setData(result);
    };

    // A transaction fires one event per row; coalescing them into a single refetch keeps
    // bulk operations (emptying the trash, importing a backup) from re-querying hundreds of times.
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      setTimeout(() => void run(), 0);
    };

    void run();
    const subscription = addDatabaseChangeListener(({ tableName }) => {
      if ((tables as readonly string[]).includes(tableName)) schedule();
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
    // The caller's deps decide when the query itself changes; `tables` is a static list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return data;
}
