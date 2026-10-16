import { z } from 'zod';

/**
 * Flashcard validation (UC-17 §5.4). The model must answer with `{"cards":[{"q","a"}]}`; small
 * models often wrap it in prose, so we extract the first balanced `{...}` before parsing.
 */

export const FlashcardSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1).max(300),
});

export const FlashcardDeckSchema = z.object({
  cards: z.array(FlashcardSchema).min(1).max(10),
});

export type Flashcard = z.infer<typeof FlashcardSchema>;
export type FlashcardDeck = z.infer<typeof FlashcardDeckSchema>;

/** Extracts the first balanced `{...}` block, ignoring braces inside strings. */
export function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}

/** Parses a model answer into a validated deck, or `null` if it cannot be recovered. */
export function parseFlashcardDeck(raw: string): FlashcardDeck | null {
  const json = extractJsonObject(raw);
  if (!json) return null;
  try {
    const parsed = FlashcardDeckSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const LEAD = '^\\s*(?:[#>*-]+\\s*|\\d+[.)]\\s*)*';
const QUESTION_LINE = new RegExp(
  `${LEAD}(?:pregunta|question|p|q)\\s*\\d*\\s*[:.)-]\\s*(.+)$`,
  'i',
);
const ANSWER_LINE = new RegExp(`${LEAD}(?:respuesta|answer|r|a)\\s*\\d*\\s*[:.)-]\\s*(.+)$`, 'i');

function decodeJsonString(value: string): string {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value;
  }
}

// Matches one card object regardless of the surrounding JSON being valid, truncated or comma-broken,
// accepting `q`/`front`/`question`/`pregunta` and `a`/`back`/`answer`/`respuesta` (models disagree).
const CARD_OBJECT_RE =
  /\{\s*"(?:q|front|question|pregunta)"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"(?:a|back|answer|respuesta)"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/gi;

/**
 * Repairs the common small-model failures: truncated JSON, trailing commas or `front`/`back` keys.
 * Extracts every complete card object individually, so a broken tail does not lose the good cards.
 */
export function repairFlashcardDeck(raw: string): FlashcardDeck | null {
  const cards: Flashcard[] = [];
  for (const match of raw.matchAll(CARD_OBJECT_RE)) {
    const q = decodeJsonString(match[1] ?? '').trim();
    const a = decodeJsonString(match[2] ?? '').trim();
    if (q && a) cards.push({ q, a: a.slice(0, 300) });
  }
  if (cards.length === 0) return null;
  const parsed = FlashcardDeckSchema.safeParse({ cards: cards.slice(0, 10) });
  return parsed.success ? parsed.data : null;
}

/**
 * Tolerant fallback (UC-17 §9a): some small models answer with `P:`/`R:` lines instead of JSON.
 * Pairs each question line with the next answer line.
 */
export function parseFlashcardsFromLines(raw: string): FlashcardDeck | null {
  const cards: Flashcard[] = [];
  let question: string | null = null;
  for (const line of raw.split('\n')) {
    const q = line.match(QUESTION_LINE);
    if (q?.[1]) {
      question = q[1].trim();
      continue;
    }
    const a = line.match(ANSWER_LINE);
    if (a?.[1] && question) {
      cards.push({ q: question, a: a[1].trim().slice(0, 300) });
      question = null;
    }
  }
  if (cards.length === 0) return null;
  const parsed = FlashcardDeckSchema.safeParse({ cards: cards.slice(0, 10) });
  return parsed.success ? parsed.data : null;
}

/** Strict JSON → repaired JSON → tolerant `P:`/`R:` lines (UC-17 §5.4 / §9a). */
export function parseAnyFlashcardDeck(raw: string): FlashcardDeck | null {
  return parseFlashcardDeck(raw) ?? repairFlashcardDeck(raw) ?? parseFlashcardsFromLines(raw);
}
