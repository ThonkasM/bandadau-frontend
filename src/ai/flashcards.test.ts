import {
  extractJsonObject,
  parseAnyFlashcardDeck,
  parseFlashcardDeck,
  parseFlashcardsFromLines,
  repairFlashcardDeck,
} from './flashcards';

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

describe('parseFlashcardsFromLines (tolerant fallback, UC-17 §9a)', () => {
  it('parses P:/R: pairs', () => {
    const raw = 'P: ¿Qué es el sol?\nR: Una estrella.\nP: ¿Y la luna?\nR: Un satélite.';
    expect(parseFlashcardsFromLines(raw)).toEqual({
      cards: [
        { q: '¿Qué es el sol?', a: 'Una estrella.' },
        { q: '¿Y la luna?', a: 'Un satélite.' },
      ],
    });
  });

  it('accepts Q:/A: and ignores a dangling question', () => {
    const raw = 'Q: Uno\nA: Dos\nP: sin respuesta';
    expect(parseFlashcardsFromLines(raw)?.cards).toHaveLength(1);
  });

  it('parses numbered / markdown labeled lines', () => {
    const raw =
      '1. Pregunta: ¿Qué es el sol?\nRespuesta: Una estrella.\n\n### Pregunta 2: ¿Y la luna?\n- Respuesta: Un satélite.';
    expect(parseFlashcardsFromLines(raw)?.cards).toEqual([
      { q: '¿Qué es el sol?', a: 'Una estrella.' },
      { q: '¿Y la luna?', a: 'Un satélite.' },
    ]);
  });

  it('returns null when there is nothing to pair', () => {
    expect(parseFlashcardsFromLines('texto sin tarjetas')).toBeNull();
  });
});

describe('parseAnyFlashcardDeck', () => {
  it('prefers JSON but falls back to lines', () => {
    expect(parseAnyFlashcardDeck('{"cards":[{"q":"a","a":"b"}]}')?.cards).toHaveLength(1);
    expect(parseAnyFlashcardDeck('P: a\nR: b')?.cards).toHaveLength(1);
  });
});

describe('repairFlashcardDeck', () => {
  it('recovers the complete cards from truncated JSON', () => {
    const raw = '{"cards":[{"q":"a","a":"b"},{"q":"c","a":"d"},{"q":"e","a":"f';
    expect(repairFlashcardDeck(raw)?.cards).toEqual([
      { q: 'a', a: 'b' },
      { q: 'c', a: 'd' },
    ]);
  });

  it('accepts front/back keys and escaped quotes', () => {
    const raw = '{"cards":[{"front":"¿Qué es \\"BotW\\"?","back":"Un juego"}]}';
    expect(repairFlashcardDeck(raw)?.cards).toEqual([{ q: '¿Qué es "BotW"?', a: 'Un juego' }]);
  });

  it('returns null when there are no card objects', () => {
    expect(repairFlashcardDeck('solo texto')).toBeNull();
  });
});
