import { toFtsMatchExpression } from './fts';

describe('toFtsMatchExpression', () => {
  it('returns null when there is no usable term', () => {
    expect(toFtsMatchExpression('')).toBeNull();
    expect(toFtsMatchExpression('   ')).toBeNull();
  });

  it('quotes each word as a prefix and joins them with an implicit AND', () => {
    expect(toFtsMatchExpression('shopping list')).toBe('"shopping"* "list"*');
  });

  it('collapses repeated whitespace', () => {
    expect(toFtsMatchExpression('  shopping   list  ')).toBe('"shopping"* "list"*');
  });

  // These are the cases this module exists for: unquoted, FTS5 would parse them as syntax and
  // the query would throw while the user is still typing.
  it.each([
    ['cost-benefit', '"cost-benefit"*'],
    ['NOT', '"NOT"*'],
    ['AND', '"AND"*'],
    ['house*', '"house*"*'],
    ['(hello)', '"(hello)"*'],
    ['^start', '"^start"*'],
  ])('neutralizes FTS5 syntax in %s', (input, expected) => {
    expect(toFtsMatchExpression(input)).toBe(expected);
  });

  it('escapes quotes by doubling them', () => {
    expect(toFtsMatchExpression('the "big"')).toBe('"the"* """big"""*');
  });
});
