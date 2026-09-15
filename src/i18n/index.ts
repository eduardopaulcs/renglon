import { getLocales } from 'expo-localization';

import { formatNoteDate } from '@/lib/dates';

import { en } from './en';
import { es, type PluralKey, type TranslationKey } from './es';
import { resolveLanguage, translate, translatePlural, type Params } from './translate';

export type { PluralKey, TranslationKey } from './es';

/**
 * Resolved once at startup. Changing the phone language restarts the app on Android, so there
 * is no need to react to locale changes while it runs.
 */
export const language = resolveLanguage(getLocales()[0]?.languageCode);

const dictionary: Record<TranslationKey, string> = language === 'en' ? en : es;

export function t(key: TranslationKey, params?: Params): string {
  return translate(dictionary, key, params);
}

export function tp(key: PluralKey, count: number, params?: Params): string {
  return translatePlural(dictionary, key, count, params);
}

export function formatDate(timestamp: number): string {
  return formatNoteDate(timestamp, language, { yesterday: t('date.yesterday') });
}
