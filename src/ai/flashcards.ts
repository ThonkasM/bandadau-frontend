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

const QUESTION_LINE = /^\s*(?:p|q|pregunta|question)\s*[:.)-]\s*(.+)$/i;
const ANSWER_LINE = /^\s*(?:r|a|respuesta|answer)\s*[:.)-]\s*(.+)$/i;

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

/** JSON first, then the tolerant line format (UC-17 §5.4 / §9a). */
export function parseAnyFlashcardDeck(raw: string): FlashcardDeck | null {
  return parseFlashcardDeck(raw) ?? parseFlashcardsFromLines(raw);
}
