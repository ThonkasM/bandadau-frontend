import type { Locale } from '@bandada/i18n';

import { extractiveSummary } from './extractive-summary';
import type { Flashcard, FlashcardDeck } from './flashcards';
import { parseAnyFlashcardDeck } from './flashcards';
import type { ChatMessage, LocalLlm } from './local-llm';
import { FLASHCARD_RETRY, flashcardTopUp, promptSystem } from './prompts';
import { stripMarkdown } from './text';

/** UC-17 §5.4: input capped at 12 000 chars; longer texts are summarized with map-reduce. */
export const MAX_INPUT_CHARS = 12_000;
/** Aim for at least this many flashcards, topping up if the model returns fewer. */
export const MIN_FLASHCARDS = 5;
const MAX_FLASHCARDS = 10;
const CHUNK_CHARS = 6_000;

/** Cleans one card: strips Markdown and swaps the pair when the "answer" is the interrogative one. */
function cleanCard(card: Flashcard): Flashcard {
  const q = stripMarkdown(card.q);
  const a = stripMarkdown(card.a);
  if (!q.includes('?') && a.includes('?')) return { q: a, a: q };
  return { q, a };
}

function dedupeCards(cards: readonly Flashcard[]): Flashcard[] {
  const seen = new Set<string>();
  const out: Flashcard[] = [];
  for (const card of cards.map(cleanCard)) {
    const key = card.q.toLowerCase().trim();
    if (seen.has(key) || !card.q || !card.a) continue;
    seen.add(key);
    out.push(card);
    if (out.length >= MAX_FLASHCARDS) break;
  }
  return out;
}

function logRaw(label: string, value: string): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(`[assistant] raw flashcards ${label}:\n`, value);
  }
}

export interface StudyAssistant {
  /** True when a real LLM backend is available (flashcards need it; the extractive mode does not). */
  readonly canGenerateFlashcards: boolean;
  summarize(
    text: string,
    locale: Locale,
    onToken?: (token: string) => void,
    signal?: AbortSignal,
  ): Promise<string>;
  generateFlashcards(text: string, locale: Locale): Promise<FlashcardDeck | null>;
}

function chunk(text: string, size = CHUNK_CHARS): string[] {
  if (text.length <= size) return [text];
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += size) parts.push(text.slice(i, i + size));
  return parts;
}

/** Wraps `LocalLlm` into the UC-17 study flows (summarize + flashcards). No network, ever. */
export function createStudyAssistant(llm: LocalLlm): StudyAssistant {
  const summarizeChunk = (
    text: string,
    locale: Locale,
    onToken?: (token: string) => void,
    signal?: AbortSignal,
  ): Promise<string> => {
    const messages: ChatMessage[] = [
      { role: 'system', content: promptSystem('summary', locale) },
      { role: 'user', content: text },
    ];
    return llm.generate(messages, { maxTokens: 512, temperature: 0.2, onToken, signal });
  };

  return {
    get canGenerateFlashcards() {
      return llm.backend !== 'extractive';
    },

    async summarize(text, locale, onToken, signal) {
      const input = text.slice(0, MAX_INPUT_CHARS).trim();
      if (!input) return '';
      // No model backend → extractive summary (UC-17 alterno 1a "modo básico").
      if (llm.backend === 'extractive') return extractiveSummary(input);
      try {
        const parts = chunk(input);
        const result =
          parts.length === 1
            ? await summarizeChunk(input, locale, onToken, signal)
            : await (async () => {
                // map-reduce: summarize each chunk (no streaming), then summarize the concatenation.
                const partials: string[] = [];
                for (const part of parts) {
                  partials.push(await summarizeChunk(part, locale, undefined, signal));
                }
                return summarizeChunk(partials.join('\n\n'), locale, onToken, signal);
              })();
        return stripMarkdown(result);
      } catch {
        // Model not downloaded or runtime missing → keep the assistant usable offline.
        return extractiveSummary(input);
      }
    },

    async generateFlashcards(text, locale) {
      const input = text.slice(0, MAX_INPUT_CHARS).trim();
      if (!input || llm.backend === 'extractive') return null;
      const messages: ChatMessage[] = [
        { role: 'system', content: promptSystem('flashcards', locale) },
        { role: 'user', content: input },
      ];
      const first = await llm.generate(messages, { maxTokens: 1024, temperature: 0.2 });
      logRaw('answer', first);
      let deck = parseAnyFlashcardDeck(first);
      if (!deck) {
        // One strict retry before giving up (UC-17 §5.4 step 3).
        const retry = await llm.generate(
          [
            ...messages,
            { role: 'assistant', content: first },
            { role: 'user', content: FLASHCARD_RETRY[locale] },
          ],
          { maxTokens: 1024, temperature: 0 },
        );
        logRaw('retry', retry);
        deck = parseAnyFlashcardDeck(retry);
      }
      if (!deck) return null;
      if (deck.cards.length >= MIN_FLASHCARDS) return { cards: dedupeCards(deck.cards) };

      // Top up to reach at least MIN cards, asking for distinct ones and deduping by question.
      const missing = MIN_FLASHCARDS - deck.cards.length;
      const more = await llm.generate(
        [
          ...messages,
          { role: 'assistant', content: JSON.stringify({ cards: deck.cards }) },
          { role: 'user', content: flashcardTopUp(locale, missing) },
        ],
        { maxTokens: 1024, temperature: 0.3 },
      );
      logRaw('top-up', more);
      const extra = parseAnyFlashcardDeck(more);
      return { cards: dedupeCards([...deck.cards, ...(extra?.cards ?? [])]) };
    },
  };
}
