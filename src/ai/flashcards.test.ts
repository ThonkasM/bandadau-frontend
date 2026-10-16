import { extractJsonObject, parseFlashcardDeck } from './flashcards';

describe('extractJsonObject', () => {
  it('extracts a balanced object surrounded by prose', () => {
    expect(extractJsonObject('bla {"cards":[]} bla')).toBe('{"cards":[]}');
  });

  it('ignores braces inside strings', () => {
    expect(extractJsonObject('{"a":"{x}"}')).toBe('{"a":"{x}"}');
  });

  it('returns null when there is no object', () => {
    expect(extractJsonObject('no json here')).toBeNull();
  });
});

describe('parseFlashcardDeck', () => {
  it('accepts a valid deck', () => {
    const raw = '{"cards":[{"q":"¿Qué es el sol?","a":"Una estrella."}]}';
    expect(parseFlashcardDeck(raw)).toEqual({ cards: [{ q: '¿Qué es el sol?', a: 'Una estrella.' }] });
  });

  it('recovers JSON wrapped in prose/fences', () => {
    const raw = 'Claro:\n```json\n{"cards":[{"q":"a","a":"b"}]}\n```';
    expect(parseFlashcardDeck(raw)).toEqual({ cards: [{ q: 'a', a: 'b' }] });
  });

  it('rejects a deck with empty fields or too many cards', () => {
    expect(parseFlashcardDeck('{"cards":[{"q":"","a":"x"}]}')).toBeNull();
    const many = { cards: Array.from({ length: 11 }, (_, i) => ({ q: `q${i}`, a: 'a' })) };
    expect(parseFlashcardDeck(JSON.stringify(many))).toBeNull();
  });
});
