/**
 * Traduce lo que escribe el usuario a una expresion MATCH de FTS5.
 *
 * FTS5 tiene sintaxis propia: `-` niega, `*` es prefijo, `"` delimita frases,
 * y `AND`/`OR`/`NOT` son operadores. Si se pasara el texto crudo, buscar
 * "costo-beneficio" o un parentesis suelto tiraria un error de sintaxis en
 * plena escritura. Por eso cada palabra se cita: dentro de comillas, FTS5
 * trata todo como literal.
 */
export function toFtsMatchExpression(term: string): string | null {
  const trimmed = term.trim();
  if (!trimmed) return null;

  const words = trimmed
    .split(/\s+/)
    // Las comillas internas se escapan duplicandolas, como en SQL.
    .map((word) => word.replace(/"/g, '""'))
    .filter((word) => word.length > 0)
    .map((word) => `"${word}"`);

  if (words.length === 0) return null;

  // Espacio = AND implicito en FTS5: se exigen todas las palabras.
  return words.join(' ');
}
