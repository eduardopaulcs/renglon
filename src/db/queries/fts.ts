/**
 * Turns what the user types into an FTS5 MATCH expression.
 *
 * FTS5 has its own syntax: `-` negates, `*` is a prefix match, `"` delimits phrases, and
 * `AND`/`OR`/`NOT` are operators. Passing the raw text through would make a search for
 * "cost-benefit" or a stray parenthesis throw a syntax error while the user is still typing.
 * That is why every word is quoted: inside quotes, FTS5 treats everything literally.
 */
export function toFtsMatchExpression(term: string): string | null {
  const trimmed = term.trim();
  if (!trimmed) return null;

  const words = trimmed
    .split(/\s+/)
    // Inner quotes are escaped by doubling them, as in SQL.
    .map((word) => word.replace(/"/g, '""'))
    .filter((word) => word.length > 0)
    .map((word) => `"${word}"`);

  if (words.length === 0) return null;

  // A space is an implicit AND in FTS5: every word is required.
  return words.join(' ');
}
