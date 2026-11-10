import type { Locale } from '@bandada/i18n';

import { extractiveSummary, splitSentences } from './extractive-summary';
import type { Flashcard, FlashcardDeck } from './flashcards';
import { parseAnyFlashcardDeck } from './flashcards';
import type { ChatMessage, LocalLlm } from './local-llm';
import {
  buildMessages,
  chunkText,
  cleanSummary,
  type CountRange,
  FLASHCARD_RETRY,
  FLASHCARD_SCHEMA,
  flashcardTopUp,
  GENERATION_PARAMS,
  MAX_INPUT_CHARS as PROMPT_INPUT_CHARS,
  NO_CONTENT,
  parseFlashcards,
  prepareInput,
  type PromptKind,
  promptSystem,
  targetCardCount,
} from './prompts';
import { contentTokens, fold, stem, stripMarkdown } from './text';

/** UC-17 §5.4: input capped at 12 000 chars; longer texts are summarized with map-reduce. */
export const MAX_INPUT_CHARS = 12_000;
/** Aim for at least this many flashcards, topping up if the model returns fewer. */
export const MIN_FLASHCARDS = 5;
const MAX_FLASHCARDS = 10;
const MAX_REDUCE_LEVELS = 3;
/** Rough size of one JSON card in tokens (~25 words + keys): sizes the output and the progress bar. */
const TOKENS_PER_CARD = 55;
/** Context assumed until the runtime reports the real one (ExecuTorch exports are often 2k). */
const DEFAULT_CONTEXT_TOKENS = 2048;
/** Conservative chars per token for Spanish/English with the Llama 3 tokenizer. */
const CHARS_PER_TOKEN = 3.2;
/** Chat template, tags and reminder around the user text, plus a safety margin. */
const PROMPT_OVERHEAD_TOKENS = 180;
const MIN_CHUNK_CHARS = 1200;
/**
 * Flashcards use smaller chunks than summaries: each section of the text gets its own share of the
 * deck, so a long text is covered end to end instead of the model clustering on its first lines.
 */
const FLASHCARD_CHUNK_CHARS = 3500;
/** Cards requested across all chunks: a bit above the deck size so the filters have room. */
const FLASHCARD_OVERGENERATE = 13;
/** Share of an answer's content words that must appear in the source to count as grounded. */
const MIN_GROUNDING = 0.4;
/** Questions paraphrase more than answers, so they are held to a looser bar. */
const QUESTION_WEIGHT = 0.3;
/** Summary lines supported by less than this share of the source's words are likely invented. */
const MIN_LINE_GROUNDING = 0.35;
/** Two questions sharing more than this share of their words ask the same thing. */
const NEAR_DUPLICATE = 0.75;
/** Cards that refer to "the text" are useless once the text is out of sight. */
const META_REFERENCE =
  /\b(?:seg[uú]n|de acuerdo con|en|del?) (?:el|este|dicho) (?:texto|fragmento|pasaje|documento|art[ií]culo)\b|\b(?:according to|in|from|of) (?:the|this) (?:text|passage|excerpt|document|article)\b/i;
/** Small models sometimes echo the prompt rules instead of summarizing; fall back to extractive. */
const INSTRUCTION_ECHO =
  /sin (?:t[ií]tulo|numeraci[oó]n|vi[nñ]etas|markdown)|una por l[ií]nea|solo el resumen|no menciones (?:estas|las) instrucciones|no (?:title|numbering|bullets|markdown)|one per line|summary only|do not mention these instructions/i;

/* ------------------------------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------------------------- */

/** Aborts must propagate: swallowing them would silently switch to the extractive fallback. */
function isAbort(error: unknown, signal?: AbortSignal): boolean {
  return Boolean(signal?.aborted) || (error instanceof Error && error.name === 'AbortError');
}

function logRaw(label: string, value: string): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(`[assistant] raw flashcards ${label}:\n`, value);
  }
}

/** Cleans one card: strips Markdown and swaps the pair when the "answer" is the interrogative one. */
function cleanCard(card: Flashcard): Flashcard {
  const q = stripMarkdown(card.q);
  const a = stripMarkdown(card.a);
  if (!q.includes('?') && a.includes('?')) return { q: a, a: q };
  return { q, a };
}

/** Dedupes by question (accent/punctuation-insensitive). Does not cap: the caller does. */
function dedupeCards(cards: readonly Flashcard[]): Flashcard[] {
  const seen = new Set<string>();
  const out: Flashcard[] = [];
  for (const card of cards.map(cleanCard)) {
    const key = fold(card.q);
    if (!key || !card.a || seen.has(key)) continue;
    seen.add(key);
    out.push(card);
  }
  return out;
}

/** Share of the text's content words (>= 4 chars, stemmed) found in the source (1 = fully grounded). */
function support(text: string, source: ReadonlySet<string>): number {
  const tokens = contentTokens(text)
    .filter((t) => t.length >= 4)
    .map(stem);
  if (tokens.length === 0) return 1;
  return tokens.filter((t) => source.has(t)).length / tokens.length;
}

/** Answer support weighs most; a question about things the source never mentions drags the card down. */
function groundedness(card: Flashcard, source: ReadonlySet<string>): number {
  return (
    (1 - QUESTION_WEIGHT) * support(card.a, source) + QUESTION_WEIGHT * support(card.q, source)
  );
}

function tokenSet(text: string): Set<string> {
  return new Set(contentTokens(text).map(stem));
}

function overlap(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / Math.min(a.size, b.size);
}

/** Cards that cannot be studied: leaked answers, "according to the text" or yes/no questions. */
function isStudyable(card: Flashcard): boolean {
  if (META_REFERENCE.test(card.q)) return false;
  const q = tokenSet(card.q);
  const a = tokenSet(card.a);
  // The question already contains (almost) the whole answer.
  if (a.size >= 2 && overlap(a, q) >= 0.8 && a.size <= q.size) return false;
  return true;
}

/** Drops cards that ask the same thing in different words (keeps the first). */
function dropNearDuplicates(cards: readonly Flashcard[]): Flashcard[] {
  const kept: { card: Flashcard; tokens: Set<string> }[] = [];
  for (const card of cards) {
    const tokens = tokenSet(card.q);
    if (kept.some((k) => tokens.size >= 3 && overlap(tokens, k.tokens) > NEAR_DUPLICATE)) continue;
    kept.push({ card, tokens });
  }
  return kept.map((k) => k.card);
}

/**
 * Prefers cards supported by the source (small models hallucinate), best supported first within the
 * deck. Weakly grounded cards are only used to reach the minimum.
 */
function selectCards(
  cards: readonly Flashcard[],
  source: ReadonlySet<string>,
  min: number,
): Flashcard[] {
  const unique = dropNearDuplicates(dedupeCards(cards).filter(isStudyable));
  const grounded = unique.filter((c) => groundedness(c, source) >= MIN_GROUNDING);
  if (grounded.length >= min) return grounded;
  const rest = unique
    .filter((c) => !grounded.includes(c))
    .sort((a, b) => groundedness(b, source) - groundedness(a, source));
  return [...grounded, ...rest.slice(0, min - grounded.length)];
}

/**
 * Orders the deck as the text flows: each card goes where the sentence that best matches it sits,
 * so studying the cards follows the material instead of jumping between sections.
 */
function orderBySource(cards: readonly Flashcard[], input: string): Flashcard[] {
  const sentences = splitSentences(input).map(tokenSet);
  const position = (card: Flashcard): number => {
    const tokens = tokenSet(`${card.q} ${card.a}`);
    let best = Number.MAX_SAFE_INTEGER;
    let bestHits = 0;
    sentences.forEach((sentence, index) => {
      let hits = 0;
      for (const t of tokens) if (sentence.has(t)) hits += 1;
      if (hits > bestHits) {
        bestHits = hits;
        best = index;
      }
    });
    return best;
  };
  return cards
    .map((card, index) => ({ card, index, at: position(card) }))
    .sort((a, b) => a.at - b.at || a.index - b.index)
    .map((x) => x.card);
}

/** Round-robin merge so that no part of a long text monopolizes the final deck. */
function interleave<T>(lists: readonly T[][]): T[] {
  const out: T[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i += 1) {
    for (const list of lists) {
      const item = list[i];
      if (item !== undefined) out.push(item);
    }
  }
  return out;
}

/** Own parser first (tolerant + validated), then the project's `parseAnyFlashcardDeck`. */
function parseCards(raw: string): Flashcard[] {
  const mine = parseFlashcards(raw);
  if (mine.length > 0) return mine;
  return [...(parseAnyFlashcardDeck(raw)?.cards ?? [])];
}

/**
 * Repairs a model summary: removes repeated lines, a last sentence cut off by the token limit and
 * lines the source does not support (hallucinations). Returns '' when nothing survives.
 */
function refineSummary(summary: string, source: ReadonlySet<string>): string {
  const seen = new Set<string>();
  let lines = summary.split('\n').filter((line) => {
    const key = fold(line);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const last = lines[lines.length - 1];
  if (lines.length > 1 && last && !/[.!?…:)"»]$/.test(last) && last.split(/\s+/).length > 4) {
    lines = lines.slice(0, -1);
  }
  const supported = lines.filter(
    (line) => contentTokens(line).length < 4 || support(line, source) >= MIN_LINE_GROUNDING,
  );
  return supported.join('\n');
}

/** Central idea first, then the key points as bullets (same bullet style as the extractive mode). */
function formatSummary(summary: string): string {
  const [lead, ...points] = summary.split('\n');
  if (!lead || points.length === 0) return summary;
  return [lead, ...points.map((p) => `• ${p}`)].join('\n');
}

/** True when the summary is unusable: too short for the input, or a repetition loop. */
function isDegenerate(summary: string, inputLength: number): boolean {
  if (!summary) return true;
  // The model copied the prompt's rules ("sin título, sin numeración…") instead of summarizing.
  if (INSTRUCTION_ECHO.test(summary)) return true;
  if (summary.length < 20 && inputLength > 300) return true;
  const lines = summary.split('\n');
  if (lines.length >= 3 && new Set(lines.map(fold)).size / lines.length < 0.6) return true;
  return false;
}

/**
 * Holds back streamed tokens while they could still be the "not enough content" placeholder, so the
 * UI never flashes it before the real (or fallback) summary replaces it.
 */
function guardStream(
  onToken: ((token: string) => void) | undefined,
): ((token: string) => void) | undefined {
  if (!onToken) return undefined;
  const placeholders = Object.values(NO_CONTENT);
  let buffer = '';
  let released = false;
  return (token) => {
    if (released) {
      onToken(token);
      return;
    }
    buffer += token;
    const head = buffer.trimStart();
    if (placeholders.some((p) => p.startsWith(head) || head.startsWith(p))) return;
    released = true;
    onToken(buffer);
  };
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
  /** `onProgress` receives a monotonic fraction in [0, 1] while the deck is generated. */
  generateFlashcards(
    text: string,
    locale: Locale,
    signal?: AbortSignal,
    onProgress?: (fraction: number) => void,
  ): Promise<FlashcardDeck | null>;
}

/** Wraps `LocalLlm` into the UC-17 study flows (summarize + flashcards). No network, ever. */
export function createStudyAssistant(llm: LocalLlm): StudyAssistant {
  /* ---------------------------------- summary ---------------------------------- */

  const summarizeChunk = (
    text: string,
    locale: Locale,
    onToken?: (token: string) => void,
    signal?: AbortSignal,
  ): Promise<string> => {
    const { maxTokens, temperature, topP, repetitionPenalty } = GENERATION_PARAMS.summary;
    return llm.generate(buildMessages('summary', locale, text), {
      maxTokens,
      temperature,
      topP,
      repetitionPenalty,
      onToken,
      signal,
    });
  };

  const cleanPartial = (raw: string): string => cleanSummary(stripMarkdown(raw));

  /** Single call for short texts; map-reduce (re-chunking if needed) for long ones. */
  async function summarizeWithModel(
    input: string,
    locale: Locale,
    onToken?: (token: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const size = chunkChars(
      'summary',
      locale,
      GENERATION_PARAMS.summary.maxTokens,
      PROMPT_INPUT_CHARS,
    );
    let parts = chunkText(input, size);
    if (parts.length <= 1) return summarizeChunk(parts[0] ?? input, locale, onToken, signal);

    for (let level = 0; level < MAX_REDUCE_LEVELS; level += 1) {
      const partials: string[] = [];
      for (const part of parts) {
        // Intermediate summaries are not streamed to the UI.
        const partial = cleanPartial(await summarizeChunk(part, locale, undefined, signal));
        if (partial && partial !== NO_CONTENT[locale]) partials.push(partial);
      }
      const joined = partials.join('\n');
      if (!joined) return '';
      if (joined.length <= size || level === MAX_REDUCE_LEVELS - 1) {
        return summarizeChunk(prepareInput(joined, size), locale, onToken, signal);
      }
      parts = chunkText(joined, size);
    }
    return '';
  }

  /** Returns null when the model output is not usable (caller falls back to extractive). */
  function finalizeSummary(raw: string, locale: Locale, input: string): string | null {
    const cleaned = cleanPartial(raw);
    // "Not enough content" is only trusted for tiny inputs; on real text it is a model failure.
    if (cleaned.startsWith(NO_CONTENT[locale]) && input.length >= 200) return null;
    if (isDegenerate(cleaned, input.length)) return null;
    const refined = refineSummary(cleaned, tokenSet(input));
    return isDegenerate(refined, input.length) ? null : formatSummary(refined);
  }

  /* --------------------------------- flashcards --------------------------------- */

  /** Output tokens needed for `cards` JSON cards. */
  const cardTokens = (cards: number): number =>
    Math.min(GENERATION_PARAMS.flashcards.maxTokens, cards * TOKENS_PER_CARD + 40);

  /**
   * Largest chunk (chars) that fits the model's context together with the system prompt and the
   * answer. Uses the runtime's real window when it is known (WebLLM: 4096; ExecuTorch: read from the
   * first session) and a conservative 2k before that.
   */
  function chunkChars(kind: PromptKind, locale: Locale, outputTokens: number, cap: number): number {
    const window = llm.contextWindow?.() ?? DEFAULT_CONTEXT_TOKENS;
    const systemTokens = Math.ceil(promptSystem(kind, locale).length / CHARS_PER_TOKEN);
    const budget = window - outputTokens - systemTokens - PROMPT_OVERHEAD_TOKENS;
    return Math.max(MIN_CHUNK_CHARS, Math.min(cap, Math.floor(budget * CHARS_PER_TOKEN)));
  }

  /**
   * Cards for one chunk: first attempt → strict retry if unparseable → top-up if too few.
   * Retry and top-up are fresh requests (not a continuation of the chat): the history would not fit
   * a 2k context, and the top-up prompt already lists the questions to avoid.
   */
  async function cardsForChunk(
    part: string,
    locale: Locale,
    count: CountRange,
    signal?: AbortSignal,
    report: (fraction: number) => void = () => undefined,
  ): Promise<Flashcard[]> {
    const { temperature, topP, repetitionPenalty } = GENERATION_PARAMS.flashcards;
    const sampling = { topP, repetitionPenalty, jsonSchema: FLASHCARD_SCHEMA, signal };
    const messages: ChatMessage[] = buildMessages('flashcards', locale, part, count);
    const [system, user] = messages as [ChatMessage, ChatMessage];
    const withNote = (note: string): ChatMessage[] => [
      system,
      { role: 'user', content: `${user.content}\n${note}` },
    ];

    // The first answer is most of the work: map streamed tokens to the first 70% of the chunk.
    const expectedTokens = count.max * TOKENS_PER_CARD;
    let streamed = 0;
    const first = await llm.generate(messages, {
      ...sampling,
      maxTokens: cardTokens(count.max),
      temperature,
      onToken: () => {
        streamed += 1;
        report(Math.min(0.7, (streamed / expectedTokens) * 0.7));
      },
    });
    report(0.7);
    logRaw('answer', first);
    let cards = parseCards(first);

    if (cards.length === 0) {
      // One strict retry before giving up (UC-17 §5.4 step 3). Near-greedy, but not 0: the 1B model
      // loops at temperature 0 on native, where there is no repetition penalty.
      const retry = await llm.generate(withNote(FLASHCARD_RETRY[locale]), {
        ...sampling,
        maxTokens: cardTokens(count.max),
        temperature: 0.1,
      });
      logRaw('retry', retry);
      report(0.85);
      cards = parseCards(retry);
    }
    if (cards.length === 0 || cards.length >= count.min) {
      report(1);
      return cards;
    }

    const missing = count.min - cards.length;
    const more = await llm.generate(
      withNote(
        flashcardTopUp(
          locale,
          missing,
          cards.map((c) => c.q),
        ),
      ),
      { ...sampling, maxTokens: cardTokens(missing + 1), temperature: Math.max(temperature, 0.5) },
    );
    logRaw('top-up', more);
    report(1);
    return [...cards, ...parseCards(more)];
  }

  return {
    get canGenerateFlashcards() {
      return llm.backend !== 'extractive';
    },

    async summarize(text, locale, onToken, signal) {
      // Cuts at a sentence boundary instead of mid-word.
      const input = prepareInput(text, MAX_INPUT_CHARS);
      if (!input) return '';
      // No model backend → extractive summary (UC-17 alterno 1a "modo básico").
      if (llm.backend === 'extractive') return extractiveSummary(input);
      try {
        const raw = await summarizeWithModel(input, locale, guardStream(onToken), signal);
        return finalizeSummary(raw, locale, input) ?? extractiveSummary(input);
      } catch (error) {
        if (isAbort(error, signal)) throw error;
        // Model not downloaded or runtime missing → keep the assistant usable offline.
        return extractiveSummary(input);
      }
    },

    async generateFlashcards(text, locale, signal, onProgress) {
      const input = prepareInput(text, MAX_INPUT_CHARS);
      if (!input || llm.backend === 'extractive') return null;

      const size = chunkChars(
        'flashcards',
        locale,
        cardTokens(MAX_FLASHCARDS),
        FLASHCARD_CHUNK_CHARS,
      );
      const parts = chunkText(input, size);
      // One chunk: the length-based target. Several: each asks for its share of the deck.
      const countFor = (part: string): CountRange => {
        const target = targetCardCount(part);
        if (parts.length === 1) return target;
        const max = Math.min(
          target.max,
          Math.max(3, Math.ceil(FLASHCARD_OVERGENERATE / parts.length)),
        );
        return { min: Math.min(max, Math.max(2, Math.ceil(MIN_FLASHCARDS / parts.length))), max };
      };
      const perPart: Flashcard[][] = [];
      let reached = 0;
      const emit = (fraction: number) => {
        // Never goes backwards (retry/top-up restart the per-chunk scale).
        reached = Math.max(reached, Math.min(1, fraction));
        onProgress?.(reached);
      };
      emit(0);
      for (const [index, part] of parts.entries()) {
        perPart.push(
          await cardsForChunk(part, locale, countFor(part), signal, (f) =>
            emit((index + f) / parts.length),
          ),
        );
      }
      emit(1);

      const merged = interleave(perPart);
      if (merged.length === 0) return null;

      const source = new Set(contentTokens(input).map(stem));
      const cards = orderBySource(
        selectCards(merged, source, MIN_FLASHCARDS).slice(0, MAX_FLASHCARDS),
        input,
      );
      return cards.length > 0 ? { cards } : null;
    },
  };
}
