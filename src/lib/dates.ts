const DAY_MS = 86_400_000;

/**
 * Short, list-friendly date: the time for today, a label for yesterday, day and month for the
 * current year, and the full date otherwise. Anything more precise is noise on a note card.
 */
export function formatNoteDate(
  timestamp: number,
  locale: string,
  labels: { yesterday: string },
  now: Date = new Date()
): string {
  const date = new Date(timestamp);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (timestamp >= startOfToday) {
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }
  if (timestamp >= startOfToday - DAY_MS) {
    return labels.yesterday;
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(
    locale,
    sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' }
  );
}
