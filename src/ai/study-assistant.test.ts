import type { LocalLlm } from './local-llm';
import { createStudyAssistant,MIN_FLASHCARDS } from './study-assistant';

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
});
