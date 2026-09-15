export type Language = 'es' | 'en';

export type Params = Record<string, string | number>;

/** Spanish is the fallback for every language other than English, as agreed for the product. */
export function resolveLanguage(languageCode: string | null | undefined): Language {
  return languageCode === 'en' ? 'en' : 'es';
}

export function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

export function translate(dictionary: Record<string, string>, key: string, params?: Params): string {
  return interpolate(dictionary[key] ?? key, params);
}

/**
 * Both supported languages only distinguish "one" from "other", so a full CLDR plural rules
 * implementation would be dead weight. Revisit this if a language with more forms is added.
 */
export function translatePlural(
  dictionary: Record<string, string>,
  baseKey: string,
  count: number,
  params?: Params
): string {
  const key = `${baseKey}_${count === 1 ? 'one' : 'other'}`;
  return interpolate(dictionary[key] ?? key, { count, ...params });
}
