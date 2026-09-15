import { applyFormat, noteToMarkdown, safeFileName, stripMarkdown } from './markdown';

describe('noteToMarkdown', () => {
  it('uses the title as the top heading', () => {
    expect(noteToMarkdown('Groceries', '- milk')).toBe('# Groceries\n\n- milk');
  });

  it('omits the heading for untitled notes', () => {
    expect(noteToMarkdown('  ', 'just text')).toBe('just text');
  });
});

describe('safeFileName', () => {
  it('strips characters that are invalid in file names', () => {
    expect(safeFileName('a/b: c?', 'note', 'md')).toBe('a b c.md');
  });

  it('falls back when nothing usable is left', () => {
    expect(safeFileName('???', 'note', 'md')).toBe('note.md');
  });
});

describe('stripMarkdown', () => {
  it('removes block syntax', () => {
    expect(stripMarkdown('# Title\n> quote\n- item\n1. first\n- [x] done')).toBe('Title quote item first done');
  });

  it('removes inline syntax', () => {
    expect(stripMarkdown('**bold** _italic_ *also* ~~gone~~ `code`')).toBe('bold italic also gone code');
  });

  it('keeps link and image text', () => {
    expect(stripMarkdown('[docs](https://x.y) ![logo](a.png)')).toBe('docs logo');
  });

  it('does not treat snake_case as emphasis', () => {
    expect(stripMarkdown('use my_variable_name here')).toBe('use my_variable_name here');
  });
});

describe('applyFormat inline', () => {
  it('wraps the selection and keeps it selected', () => {
    expect(applyFormat('hello world', { start: 6, end: 11 }, 'bold')).toEqual({
      text: 'hello **world**',
      selection: { start: 8, end: 13 },
    });
  });

  it('places the cursor between the markers when nothing is selected', () => {
    expect(applyFormat('ab', { start: 1, end: 1 }, 'italic')).toEqual({
      text: 'a__b',
      selection: { start: 2, end: 2 },
    });
  });
});

describe('applyFormat line prefixes', () => {
  it('adds a prefix to the current line', () => {
    expect(applyFormat('one\ntwo', { start: 5, end: 5 }, 'bullet')).toEqual({
      text: 'one\n- two',
      selection: { start: 7, end: 7 },
    });
  });

  it('toggles the same prefix off', () => {
    expect(applyFormat('- two', { start: 3, end: 3 }, 'bullet').text).toBe('two');
  });

  it('replaces a different prefix instead of stacking it', () => {
    expect(applyFormat('- two', { start: 3, end: 3 }, 'checkbox').text).toBe('- [ ] two');
  });

  it('numbers every selected line', () => {
    expect(applyFormat('a\nb\nc', { start: 0, end: 5 }, 'numbered').text).toBe('1. a\n2. b\n3. c');
  });

  it('works on an empty document', () => {
    expect(applyFormat('', { start: 0, end: 0 }, 'heading')).toEqual({
      text: '# ',
      selection: { start: 2, end: 2 },
    });
  });
});
