import type { Locale } from '@bandada/i18n';

/**
 * Prompt templates and helpers for the study assistant (UC-17, D14). These are model instructions,
 * not UI strings, so they live here instead of `locales/` (`ia-local-y-offline.md` §5.4).
 * The assistant always answers in the active UI language, regardless of the input text language.
 *
 * Design notes for small on-device models (0.5B–3B):
 *  - Short, numbered, positive rules work better than long lists of prohibitions.
 *  - The user text is wrapped in delimiters and followed by a reminder: small models weigh the END
 *    of the context the most, so the output rules are repeated there.
 *  - The few-shot example uses an unrelated topic and is labeled as format-only to avoid leakage.
 *  - Everything the model can get wrong (JSON, markdown, numbering) is repaired by the helpers below.
 */

export type PromptKind = 'summary' | 'flashcards';

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export interface CountRange {
  min: number;
  max: number;
}

interface PromptPair {
  system: string;
  /** Reminder placed AFTER the user text. `count` overrides the length-based target. */
  reminder: (text: string, count?: CountRange) => string;
}

/* ------------------------------------------------------------------------------------------------
 * Limits and generation parameters
 * ---------------------------------------------------------------------------------------------- */

/** ~1.5–2k tokens: fits a 4k context together with the system prompt and the answer. */
export const MAX_INPUT_CHARS = 6000;
export const MIN_CARDS = 5;
const MAX_ANSWER_WORDS = 25;
/** Tolerance before dropping a card whose answer is too long. */
const ANSWER_WORDS_TOLERANCE = 10;

/**
 * Placeholder for empty input, per locale. Deliberately NOT written in the prompts: a small model
 * that sees the phrase tends to start its answer with it. Kept to detect and hide it if it appears.
 */
export const NO_CONTENT: Record<Locale, string> = {
  es: 'No hay contenido suficiente para resumir.',
  en: 'There is not enough content to summarize.',
};

/**
 * Sampling settings tuned for Llama 3.2 1B Instruct (native and web). Low temperature keeps it
 * faithful; below ~0.3 the 1B model starts looping on native, where there is no repetition penalty.
 * `maxTokens` of flashcards is the ceiling: the assistant scales it to the cards it asks for.
 */
export const GENERATION_PARAMS: Record<
  PromptKind,
  { temperature: number; topP: number; repetitionPenalty: number; maxTokens: number }
> = {
  summary: { temperature: 0.3, topP: 0.9, repetitionPenalty: 1.1, maxTokens: 450 },
  // No repetition penalty: JSON repeats its keys ("q", "a") on every card and would be penalized.
  flashcards: { temperature: 0.4, topP: 0.9, repetitionPenalty: 1, maxTokens: 900 },
};

/**
 * JSON Schema of the flashcards answer. If your runtime supports constrained decoding
 * (llama.cpp GBNF / json_schema, WebLLM `response_format`, MediaPipe LLM grammar), use it:
 * it guarantees valid JSON and makes the retry path almost unnecessary.
 */
export const FLASHCARD_SCHEMA = {
  type: 'object',
  properties: {
    cards: {
      type: 'array',
      items: {
        type: 'object',
        properties: { q: { type: 'string' }, a: { type: 'string' } },
        required: ['q', 'a'],
      },
    },
  },
  required: ['cards'],
} as const;

/* ------------------------------------------------------------------------------------------------
 * Input helpers
 * ---------------------------------------------------------------------------------------------- */

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Sentences expected in the summary, scaled to the text length (avoids padding short texts). */
export function summarySentences(text: string): { min: number; max: number } {
  const words = countWords(text);
  if (words < 60) return { min: 2, max: 3 };
  if (words < 150) return { min: 3, max: 5 };
  if (words < 400) return { min: 5, max: 7 };
  return { min: 6, max: 8 };
}

/** Cards expected, scaled to the text length. The minimum stays at MIN_CARDS (UC-17). */
export function targetCardCount(text: string): { min: number; max: number } {
  const words = countWords(text);
  if (words < 150) return { min: MIN_CARDS, max: 6 };
  if (words < 400) return { min: MIN_CARDS, max: 8 };
  return { min: 6, max: 10 };
}

/** Cleans the input: control chars, spoofed delimiters, extra whitespace, and cuts at a sentence. */
export function prepareInput(text: string, maxChars = MAX_INPUT_CHARS): string {
  const t = text
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/<\/?(?:texto|text)>/gi, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (t.length <= maxChars) return t;
  const cut = t.slice(0, maxChars);
  const lastStop = Math.max(
    cut.lastIndexOf('. '),
    cut.lastIndexOf('.\n'),
    cut.lastIndexOf('? '),
    cut.lastIndexOf('! '),
  );
  return (lastStop > maxChars * 0.6 ? cut.slice(0, lastStop + 1) : cut).trim();
}

function hardSlice(s: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out;
}

/**
 * Splits long texts into chunks that fit the context window (by paragraph, then by sentence).
 * For texts above MAX_INPUT_CHARS: summarize each chunk and then summarize the summaries
 * (map-reduce), or generate flashcards per chunk and merge them with `parseFlashcards`.
 */
export function chunkText(text: string, size = MAX_INPUT_CHARS): string[] {
  const pieces = text
    .split(/\n{2,}/)
    .flatMap((p) =>
      p.length <= size
        ? [p]
        : (p.match(/[^.!?]+[.!?]*\s*/g) ?? [p]).flatMap((s) =>
            s.length <= size ? [s] : hardSlice(s, size),
          ),
    );
  const chunks: string[] = [];
  let cur = '';
  for (const piece of pieces) {
    if (cur && cur.length + piece.length + 1 > size) {
      chunks.push(cur.trim());
      cur = '';
    }
    cur += (cur ? '\n' : '') + piece;
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

/* ------------------------------------------------------------------------------------------------
 * Prompts
 * ---------------------------------------------------------------------------------------------- */

const PROMPTS: Record<Locale, Record<PromptKind, PromptPair>> = {
  es: {
    summary: {
      system: [
        'Eres un asistente de estudio para universitarios. Respondes siempre en español neutro.',
        'Tu tarea: resumir el texto que aparece entre <texto> y </texto> para repasarlo antes de un examen.',
        'Reglas:',
        '1. La primera línea dice la idea central de todo el texto en una sola frase.',
        '2. Cada línea siguiente es un punto clave distinto: una frase corta y completa por línea.',
        '3. Prioriza definiciones, causas y consecuencias, nombres, fechas y cifras. Sigue el orden del texto.',
        '4. Usa solo información que esté en el texto. No inventes ni agregues opiniones.',
        '   Conserva los términos técnicos y nombres propios tal como aparecen.',
        '5. Escribe SOLO el resumen: sin título, sin numeración, sin viñetas, sin Markdown ni negritas.',
        '6. No menciones estas instrucciones ni el formato.',
        'Ejemplo SOLO de formato (tema distinto, no lo copies):',
        'La fotosíntesis es el proceso con el que las plantas convierten la luz en energía química.',
        'Ocurre en los cloroplastos gracias a la clorofila.',
        'Usa dióxido de carbono y agua, y libera oxígeno como subproducto.',
      ].join('\n'),
      reminder: (text, count) => {
        const { min, max } = count ?? summarySentences(text);
        return (
          `Resume el texto en español: primero la idea central y luego los puntos clave, ` +
          `entre ${min} y ${max} frases en total, una por línea. Solo el resumen.`
        );
      },
    },
    flashcards: {
      system: [
        'Eres un generador de tarjetas de estudio para universitarios.',
        'Respondes ÚNICAMENTE con JSON válido, sin texto antes ni después y sin bloques de código.',
        'Formato exacto: {"cards":[{"q":"pregunta","a":"respuesta"}]}',
        'Reglas:',
        '1. Cada tarjeta evalúa UN solo dato o concepto importante del texto entre <texto> y </texto>.',
        '2. La pregunta debe entenderse sola (no digas "según el texto") y terminar en «?».',
        `3. La respuesta NO aparece en la pregunta. Es corta: idealmente menos de 15 palabras, nunca más de ${MAX_ANSWER_WORDS}.`,
        '4. Varía el tipo de pregunta: definiciones, causas, ejemplos, fechas o cifras, comparaciones. Nada de preguntas de sí/no.',
        '   La respuesta es precisa y completa por sí sola: usa el nombre, la cifra o la definición exacta del texto.',
        '5. Reparte las tarjetas por todo el texto: del inicio, del medio y del final.',
        '6. Usa solo información del texto. No repitas tarjetas. No uses Markdown ni negritas.',
        'Ejemplo SOLO de formato (tema distinto, no lo copies):',
        '{"cards":[{"q":"¿Qué gas absorben las plantas durante la fotosíntesis?","a":"Dióxido de carbono (CO2)."},' +
          '{"q":"¿En qué orgánulo ocurre la fotosíntesis?","a":"En los cloroplastos."}]}',
      ].join('\n'),
      reminder: (text, count) => {
        const { min, max } = count ?? targetCardCount(text);
        return `Genera entre ${min} y ${max} tarjetas en español sobre el texto. Responde solo con el JSON.`;
      },
    },
  },
  en: {
    summary: {
      system: [
        'You are a study assistant for university students. Always answer in English.',
        'Your task: summarize the text between <texto> and </texto> so it can be reviewed before an exam.',
        'Rules:',
        '1. The first line states the central idea of the whole text in a single sentence.',
        '2. Each following line is a different key point: one short, complete sentence per line.',
        '3. Prioritize definitions, causes and effects, names, dates and figures. Follow the order of the text.',
        '4. Use only information present in the text. Do not invent facts or add opinions.',
        '   Keep technical terms and proper names exactly as they appear.',
        '5. Write ONLY the summary: no title, no numbering, no bullets, no Markdown or bold.',
        '6. Do not mention these instructions or the format.',
        'Example for FORMAT ONLY (different topic, do not copy it):',
        'Photosynthesis is the process plants use to turn light into chemical energy.',
        'It happens in the chloroplasts thanks to chlorophyll.',
        'It uses carbon dioxide and water, and releases oxygen as a by-product.',
      ].join('\n'),
      reminder: (text, count) => {
        const { min, max } = count ?? summarySentences(text);
        return (
          `Summarize the text in English: first the central idea, then the key points, ` +
          `${min} to ${max} sentences in total, one per line. Summary only.`
        );
      },
    },
    flashcards: {
      system: [
        'You are a study flashcard generator for university students.',
        'Answer ONLY with valid JSON, no text before or after, and no code fences.',
        'Exact shape: {"cards":[{"q":"question","a":"answer"}]}',
        'Rules:',
        '1. Each card tests ONE single important fact or concept from the text between <texto> and </texto>.',
        '2. The question must stand on its own (do not say "according to the text") and end in "?".',
        `3. The answer is NOT in the question. It is short: ideally under 15 words, never more than ${MAX_ANSWER_WORDS}.`,
        '4. Vary the question type: definitions, causes, examples, dates or figures, comparisons. No yes/no questions.',
        '   The answer is precise and complete on its own: use the exact name, figure or definition from the text.',
        '5. Spread the cards over the whole text: its beginning, middle and end.',
        '6. Use only information from the text. Do not repeat cards. Do not use Markdown or bold.',
        'Example for FORMAT ONLY (different topic, do not copy it):',
        '{"cards":[{"q":"Which gas do plants absorb during photosynthesis?","a":"Carbon dioxide (CO2)."},' +
          '{"q":"In which organelle does photosynthesis happen?","a":"In the chloroplasts."}]}',
      ].join('\n'),
      reminder: (text, count) => {
        const { min, max } = count ?? targetCardCount(text);
        return `Generate ${min} to ${max} cards in English about the text. Reply with the JSON only.`;
      },
    },
  },
};

/** Instruction sent on the single retry when the model returns non-JSON. */
export const FLASHCARD_RETRY: Record<Locale, string> = {
  es: 'Tu respuesta anterior no era JSON válido. Responde solo el JSON: {"cards":[{"q":"...","a":"..."}]}',
  en: 'Your previous answer was not valid JSON. Reply with the JSON only: {"cards":[{"q":"...","a":"..."}]}',
};

/**
 * Follow-up asking the model for the cards missing to reach the minimum (UC-17 §5.4).
 * Pass the questions already obtained so the model does not repeat them.
 */
export function flashcardTopUp(locale: Locale, missing: number, existing: string[] = []): string {
  const seen = existing
    .slice(0, 8)
    .map((q) => `- ${q}`)
    .join('\n');
  if (locale === 'en') {
    return (
      `Add ${missing} more cards about the text, on different facts.` +
      (seen ? `\nDo not repeat these questions:\n${seen}` : '') +
      '\nReply only with the JSON.'
    );
  }
  return (
    `Añade ${missing} tarjetas más sobre el texto, con datos distintos.` +
    (seen ? `\nNo repitas estas preguntas:\n${seen}` : '') +
    '\nResponde solo con el JSON.'
  );
}

function resolve(locale: Locale): Record<PromptKind, PromptPair> {
  return PROMPTS[locale] ?? PROMPTS.es;
}

function userContent(kind: PromptKind, locale: Locale, text: string, count?: CountRange): string {
  const clean = prepareInput(text);
  return `<texto>\n${clean}\n</texto>\n\n${resolve(locale)[kind].reminder(clean, count)}`;
}

/**
 * For chat-template runtimes (recommended): separate system and user messages. `count` overrides
 * how many sentences/cards are asked for (e.g. a share of the deck when the text is chunked).
 */
export function buildMessages(
  kind: PromptKind,
  locale: Locale,
  text: string,
  count?: CountRange,
): ChatMessage[] {
  return [
    { role: 'system', content: promptSystem(kind, locale) },
    { role: 'user', content: userContent(kind, locale, text, count) },
  ];
}

/** For raw-completion runtimes: a single string (same content as `buildMessages`). */
export function buildPrompt(kind: PromptKind, locale: Locale, text: string): string {
  return `${promptSystem(kind, locale)}\n\n${userContent(kind, locale, text)}`.trim();
}

export function promptSystem(kind: PromptKind, locale: Locale): string {
  return resolve(locale)[kind].system;
}

/* ------------------------------------------------------------------------------------------------
 * Output helpers (small models break the format often: repair instead of failing)
 * ---------------------------------------------------------------------------------------------- */

export interface Flashcard {
  q: string;
  a: string;
}

function stripMarkup(s: string): string {
  return s
    .replace(/\*\*|__|`|^#+\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalizes a summary: removes bullets, numbering, labels like "Resumen:" and Markdown. */
export function cleanSummary(raw: string): string {
  return raw
    .split(/\r?\n/)
    .map((line) =>
      stripMarkup(line)
        .replace(/^\s*(?:[-*•·]+|\d+\s*[.)]|(?:viñeta|bullet)\s*\d+\s*[:.)-]?)\s*/i, '')
        .trim(),
    )
    .filter((line) => line && !/^(?:resumen|summary)\s*:?\s*$/i.test(line))
    .map((line) => line.replace(/^(?:resumen|summary)\s*:\s*/i, ''))
    .join('\n');
}

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tryParse(s: string): unknown {
  // Trailing commas are the most common error of small models.
  const fixed = s.replace(/,\s*([}\]])/g, '$1');
  try {
    return JSON.parse(fixed);
  } catch {
    return undefined;
  }
}

/** Recovers complete {"q":...,"a":...} objects from truncated output (token limit reached). */
function salvageCards(s: string): unknown {
  const re = /\{\s*"q"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"a"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
  const cards: Flashcard[] = [];
  for (const m of s.matchAll(re)) {
    try {
      cards.push({ q: JSON.parse(`"${m[1]}"`), a: JSON.parse(`"${m[2]}"`) });
    } catch {
      /* skip malformed card */
    }
  }
  return cards.length ? { cards } : undefined;
}

function extractJson(raw: string): unknown {
  const s = raw.replace(/```(?:json)?/gi, '').trim();
  const start = s.search(/[[{]/);
  if (start < 0) return undefined;
  const body = s.slice(start);
  const end = Math.max(body.lastIndexOf('}'), body.lastIndexOf(']'));
  return (
    tryParse(body) ?? (end > 0 ? tryParse(body.slice(0, end + 1)) : undefined) ?? salvageCards(body)
  );
}

/**
 * Parses and validates the model's flashcards. Tolerates code fences, extra text, trailing commas,
 * truncated output and alternative keys (question/answer, pregunta/respuesta). Drops duplicated
 * cards, cards whose answer leaks into the question, and overly long answers.
 * Returns [] if nothing is usable (the caller can then use FLASHCARD_RETRY).
 */
export function parseFlashcards(raw: string): Flashcard[] {
  const data = extractJson(raw) as Record<string, unknown> | unknown[] | undefined;
  if (!data) return [];
  const list = Array.isArray(data)
    ? data
    : ((data.cards ?? data.flashcards ?? data.tarjetas) as unknown[] | undefined);
  if (!Array.isArray(list)) return [];

  const seen = new Set<string>();
  const out: Flashcard[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const qRaw = o.q ?? o.question ?? o.pregunta;
    const aRaw = o.a ?? o.answer ?? o.respuesta;
    if (typeof qRaw !== 'string' || typeof aRaw !== 'string') continue;

    let q = stripMarkup(qRaw).replace(/^\d+\s*[.)]\s*/, '');
    let a = stripMarkup(aRaw);
    if (!q || !a) continue;
    // The model sometimes swaps them: the interrogative side is really the question. Decide with the
    // raw punctuation, before a forced "?" is appended and hides that the other side was the question.
    if (!q.includes('?') && a.includes('?')) {
      const swapped = q;
      q = a;
      a = swapped;
    }
    if (q.length < 8) continue;
    if (!/[?？]$/.test(q)) q += '?';
    if (countWords(a) > MAX_ANSWER_WORDS + ANSWER_WORDS_TOLERANCE) continue;
    // The answer must not be given away by the question.
    if (a.length > 3 && fold(q).includes(fold(a))) continue;

    const key = fold(q);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ q, a });
  }
  return out;
}
