import { en } from './en';
import { es } from './es';
import { interpolate, resolveLanguage, translate, translatePlural } from './translate';

describe('dictionaries', () => {
  it('have exactly the same keys', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });

  it('use the same placeholders in both languages', () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(es) as (keyof typeof es)[]) {
      expect({ key, placeholders: placeholders(en[key]) }).toEqual({ key, placeholders: placeholders(es[key]) });
    }
  });
});

describe('resolveLanguage', () => {
  it('uses English only for English', () => {
    expect(resolveLanguage('en')).toBe('en');
    expect(resolveLanguage('es')).toBe('es');
  });

  it('falls back to Spanish for anything else', () => {
    expect(resolveLanguage('fr')).toBe('es');
    expect(resolveLanguage(null)).toBe('es');
    expect(resolveLanguage(undefined)).toBe('es');
  });
});

describe('interpolate', () => {
  it('replaces known placeholders and leaves unknown ones intact', () => {
    expect(interpolate('{a} and {b}', { a: 1 })).toBe('1 and {b}');
  });
});

describe('translate', () => {
  const dictionary = { greeting: 'Hi {name}', 'items_one': '{count} item', 'items_other': '{count} items' };

  it('falls back to the key when it is missing', () => {
    expect(translate(dictionary, 'missing')).toBe('missing');
  });

  it('picks the singular form only for exactly one', () => {
    expect(translatePlural(dictionary, 'items', 1)).toBe('1 item');
    expect(translatePlural(dictionary, 'items', 0)).toBe('0 items');
    expect(translatePlural(dictionary, 'items', 2)).toBe('2 items');
  });
});
