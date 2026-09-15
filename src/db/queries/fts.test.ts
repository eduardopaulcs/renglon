import { toFtsMatchExpression } from './fts';

describe('toFtsMatchExpression', () => {
  it('devuelve null si no hay termino util', () => {
    expect(toFtsMatchExpression('')).toBeNull();
    expect(toFtsMatchExpression('   ')).toBeNull();
  });

  it('cita cada palabra y las une con AND implicito', () => {
    expect(toFtsMatchExpression('lista super')).toBe('"lista" "super"');
  });

  it('colapsa espacios repetidos', () => {
    expect(toFtsMatchExpression('  lista   super  ')).toBe('"lista" "super"');
  });

  // Estos son los casos por los que existe el modulo: sin citar, FTS5 los
  // interpretaria como sintaxis y la consulta tiraria error mientras el
  // usuario todavia esta tecleando.
  it.each([
    ['costo-beneficio', '"costo-beneficio"'],
    ['NOT', '"NOT"'],
    ['AND', '"AND"'],
    ['casa*', '"casa*"'],
    ['(hola)', '"(hola)"'],
    ['^inicio', '"^inicio"'],
  ])('neutraliza la sintaxis de FTS5 en %s', (input, expected) => {
    expect(toFtsMatchExpression(input)).toBe(expected);
  });

  it('escapa comillas duplicandolas', () => {
    expect(toFtsMatchExpression('el "grande"')).toBe('"el" """grande"""');
  });
});
