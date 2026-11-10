import type { LocalLlm } from './local-llm';
import { createStudyAssistant, MIN_FLASHCARDS } from './study-assistant';

/** Minimal `LocalLlm` double that returns staged answers in order. */
function fakeLlm(answers: string[]): LocalLlm {
  let index = 0;
  return {
    backend: 'executorch',
    capabilities: async () => ({ supported: true, recommended: null }),
    status: () => ({ kind: 'ready' }),
    onStatus: () => () => {},
    download: async () => {},
    load: async () => {},
    generate: async () => answers[index++] ?? '',
    unload: async () => {},
    remove: async () => {},
  };
}

describe('createStudyAssistant.generateFlashcards', () => {
  it('returns the deck as-is when it already has enough cards', async () => {
    const deck = { cards: Array.from({ length: 5 }, (_, i) => ({ q: `q${i}`, a: 'a' })) };
    const assistant = createStudyAssistant(fakeLlm([JSON.stringify(deck)]));
    expect((await assistant.generateFlashcards('texto', 'es'))?.cards).toHaveLength(5);
  });

  it('tops up to the minimum and drops duplicate questions', async () => {
    const first = '{"cards":[{"q":"a","a":"1"},{"q":"b","a":"2"}]}';
    const more =
      '{"cards":[{"q":"c","a":"3"},{"q":"d","a":"4"},{"q":"e","a":"5"},{"q":"a","a":"dup"}]}';
    const assistant = createStudyAssistant(fakeLlm([first, more]));
    const deck = await assistant.generateFlashcards('texto', 'es');
    expect(deck?.cards).toHaveLength(MIN_FLASHCARDS);
    expect(deck?.cards.map((c) => c.q)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('returns null when the model never produces a parseable deck', async () => {
    const assistant = createStudyAssistant(fakeLlm(['nada útil', 'tampoco']));
    expect(await assistant.generateFlashcards('texto', 'es')).toBeNull();
  });

  it('strips markdown and swaps a card whose "answer" is the question', async () => {
    const raw = '{"cards":[{"q":"**Link** es el héroe.","a":"¿Quién es el héroe?"}]}';
    const assistant = createStudyAssistant(fakeLlm([raw, raw, raw]));
    const deck = await assistant.generateFlashcards('texto', 'es');
    expect(deck?.cards[0]).toEqual({ q: '¿Quién es el héroe?', a: 'Link es el héroe.' });
  });
});

describe('createStudyAssistant.summarize', () => {
  it('strips markdown from the summary', async () => {
    const assistant = createStudyAssistant(fakeLlm(['**Resumen** de prueba']));
    expect(await assistant.summarize('un texto de estudio', 'es')).toBe('Resumen de prueba');
  });
});

describe('quality filters', () => {
  const SOURCE =
    'La mitocondria es el orgánulo que produce energía en forma de ATP. ' +
    'La célula vegetal posee cloroplastos que realizan la fotosíntesis. ' +
    'El núcleo almacena el material genético en forma de ADN.';

  it('drops cards that cite the text, leak the answer or repeat a question', async () => {
    const cards = [
      { q: '¿Qué produce la mitocondria según el texto?', a: 'Energía en forma de ATP.' },
      { q: '¿Qué orgánulo produce energía en forma de ATP?', a: 'La mitocondria.' },
      { q: '¿Qué orgánulo produce la energía en forma de ATP?', a: 'La mitocondria.' },
      {
        q: '¿Qué almacena el núcleo, el material genético en forma de ADN?',
        a: 'Material genético ADN',
      },
      { q: '¿Dónde ocurre la fotosíntesis?', a: 'En los cloroplastos de la célula vegetal.' },
      { q: '¿Qué almacena el núcleo?', a: 'El material genético en forma de ADN.' },
      { q: '¿Qué realizan los cloroplastos?', a: 'La fotosíntesis.' },
      { q: '¿Qué es la mitocondria?', a: 'Un orgánulo que produce energía.' },
    ];
    const assistant = createStudyAssistant(fakeLlm([JSON.stringify({ cards })]));
    const deck = await assistant.generateFlashcards(SOURCE, 'es');
    const qs = deck?.cards.map((c) => c.q) ?? [];
    expect(qs.some((q) => q.includes('según el texto'))).toBe(false);
    expect(qs).not.toContain('¿Qué orgánulo produce la energía en forma de ATP?');
    expect(qs).not.toContain('¿Qué almacena el núcleo, el material genético en forma de ADN?');
  });

  it('removes invented, repeated and truncated summary lines', async () => {
    const raw = [
      'La mitocondria produce energía en forma de ATP.',
      'La mitocondria produce energía en forma de ATP.',
      'Los dinosaurios dominaron el jurásico durante millones de años.',
      'Los cloroplastos realizan la fotosíntesis en la célula vegetal.',
      'El núcleo almacena el material genético en forma de',
    ].join('\n');
    const assistant = createStudyAssistant(fakeLlm([raw]));
    expect(await assistant.summarize(SOURCE, 'es')).toBe(
      'La mitocondria produce energía en forma de ATP.\n' +
        '• Los cloroplastos realizan la fotosíntesis en la célula vegetal.',
    );
  });
});

describe('summary streaming', () => {
  it('never streams the "not enough content" placeholder', async () => {
    const llm = fakeLlm([]);
    llm.generate = async (_m, opts) => {
      const text = 'No hay contenido suficiente para resumir.';
      for (const word of text.split(/(?<= )/)) opts?.onToken?.(word);
      return text;
    };
    const streamed: string[] = [];
    const assistant = createStudyAssistant(llm);
    const input = 'El sol es una estrella de tipo G. '.repeat(10);
    const result = await assistant.summarize(input, 'es', (t) => streamed.push(t));
    expect(streamed.join('')).toBe('');
    expect(result).not.toContain('No hay contenido');
  });

  it('streams normal tokens unchanged', async () => {
    const llm = fakeLlm([]);
    llm.generate = async (_m, opts) => {
      for (const t of ['No ', 'es ', 'poco.']) opts?.onToken?.(t);
      return 'No es poco.';
    };
    const streamed: string[] = [];
    await createStudyAssistant(llm).summarize('x '.repeat(50), 'es', (t) => streamed.push(t));
    expect(streamed.join('')).toBe('No es poco.');
  });
});

describe('generateFlashcards progress', () => {
  it('reports a monotonic fraction that ends at 1', async () => {
    const deck = { cards: Array.from({ length: 5 }, (_, i) => ({ q: `pregunta ${i}?`, a: 'a' })) };
    const llm = fakeLlm([]);
    llm.generate = async (_m, opts) => {
      for (let i = 0; i < 20; i += 1) opts?.onToken?.('x');
      return JSON.stringify(deck);
    };
    const seen: number[] = [];
    await createStudyAssistant(llm).generateFlashcards('texto', 'es', undefined, (f) =>
      seen.push(f),
    );
    expect(seen[0]).toBe(0);
    expect(seen[seen.length - 1]).toBe(1);
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
  });
});

describe('context-aware chunking (Llama 3.2 1B)', () => {
  const PARAGRAPH =
    'La célula es la unidad básica de la vida y contiene orgánulos especializados. '.repeat(12);
  const LONG = Array.from({ length: 6 }, () => PARAGRAPH).join('\n\n');

  function recordingLlm(window: number | null) {
    const prompts: string[] = [];
    const llm = fakeLlm([]);
    llm.contextWindow = () => window;
    llm.generate = async (messages) => {
      prompts.push(messages[messages.length - 1]?.content ?? '');
      return '{"cards":[]}';
    };
    return { llm, prompts };
  }

  it('uses smaller chunks on a 2k context than on a 4k one', async () => {
    const small = recordingLlm(2048);
    const large = recordingLlm(4096);
    await createStudyAssistant(small.llm).summarize(LONG, 'es');
    await createStudyAssistant(large.llm).summarize(LONG, 'es');
    expect(small.prompts.length).toBeGreaterThan(large.prompts.length);
  });

  it('asks each flashcard chunk for its share of the deck', async () => {
    const { llm, prompts } = recordingLlm(4096);
    await createStudyAssistant(llm).generateFlashcards(LONG, 'es');
    const first = prompts[0] ?? '';
    expect(prompts.length).toBeGreaterThan(1);
    expect(first).toMatch(/Genera entre \d+ y [3-7] tarjetas/);
  });
});

describe('deck order', () => {
  it('orders the cards as the text flows', async () => {
    const source =
      'Primero aparece la mitocondria, que produce ATP. ' +
      'Después se describe el núcleo, que guarda el ADN. ' +
      'Al final se explican los ribosomas, que sintetizan proteínas.';
    const cards = [
      { q: '¿Qué sintetizan los ribosomas?', a: 'Proteínas.' },
      { q: '¿Qué guarda el núcleo?', a: 'El ADN.' },
      { q: '¿Qué produce la mitocondria?', a: 'ATP.' },
      { q: '¿Qué orgánulo guarda el ADN?', a: 'El núcleo.' },
      { q: '¿Qué orgánulo produce ATP?', a: 'La mitocondria.' },
    ];
    const deck = await createStudyAssistant(
      fakeLlm([JSON.stringify({ cards })]),
    ).generateFlashcards(source, 'es');
    expect(deck?.cards.map((c) => c.q)).toEqual([
      '¿Qué produce la mitocondria?',
      '¿Qué orgánulo produce ATP?',
      '¿Qué guarda el núcleo?',
      '¿Qué orgánulo guarda el ADN?',
      '¿Qué sintetizan los ribosomas?',
    ]);
  });
});
