import { formatNoteDate } from './dates';

describe('formatNoteDate', () => {
  const now = new Date(2026, 8, 15, 18, 30);
  const labels = { yesterday: 'yesterday' };

  it('shows the time for today', () => {
    const result = formatNoteDate(new Date(2026, 8, 15, 9, 5).getTime(), 'en', labels, now);
    expect(result).toMatch(/9:05|09:05/);
  });

  it('uses the label for yesterday', () => {
    expect(formatNoteDate(new Date(2026, 8, 14, 23, 59).getTime(), 'en', labels, now)).toBe('yesterday');
  });

  it('omits the year within the current year', () => {
    expect(formatNoteDate(new Date(2026, 1, 3).getTime(), 'en', labels, now)).not.toMatch(/2026/);
  });

  it('includes the year for older dates', () => {
    expect(formatNoteDate(new Date(2024, 1, 3).getTime(), 'en', labels, now)).toMatch(/2024/);
  });
});
