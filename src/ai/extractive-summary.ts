import { contentTokens, countWords, stem } from './text';

/**
 * Extractive summarizer (pure JS, no runtime): the "modo básico" fallback of UC-17 when the
 * device/browser cannot run a local LLM (`ia-local-y-offline.md` §5.2).
 *
 * Score = TextRank (sentence similarity graph) + content-word frequency + a mild lead bias.
 * Selection skips near-duplicate sentences. It only extracts; flashcards require a real model.
 */

const MIN_SENTENCE_CHARS = 30;
const MAX_SENTENCE_CHARS = 320;
/** TextRank is O(n²): above this many sentences we fall back to frequency + position only. */
const MAX_GRAPH = 150;
const REDUNDANCY_THRESHOLD = 0.5;

const ABBREVIATIONS =
  /\b(Dr|Dra|Sr|Sra|Srta|Ing|Lic|Prof|Av|Cap|Fig|Tab|Vol|Núm|pág|págs|etc|vs|cf|ej|aprox|Mr|Mrs|Ms|St|Jr|approx)\./gi;

/** Splits into sentences, protecting abbreviations, initials and decimals. No lookbehind. */
export function splitSentences(text: string): string[] {
  const protectedText = text
    // Re-join hard-wrapped lines (PDF/copy-paste): a single newline inside a sentence.
    .replace(/([^.!?…:\n])[ \t]*\n(?=[a-záéíóúñ])/g, '$1 ')
    .replace(ABBREVIATIONS, (m) => m.slice(0, -1) + '\u0001')
    .replace(/\b(EE)\.(UU)\./g, '$1\u0001$2\u0001')
    .replace(/\b([A-ZÁÉÍÓÚÑ])\.(?=\s*[A-ZÁÉÍÓÚÑ])/g, '$1\u0001')
    .replace(/(\d)\.(?=\d)/g, '$1\u0001');

  return protectedText
    .split(/\n+/)
    .flatMap((line) =>
      line
        .replace(/\s+/g, ' ')
        .replace(/([.!?…]+["»)\]]?)\s+(?=[¿¡"«(A-ZÁÉÍÓÚÑ0-9])/g, '$1\u0002')
        .split('\u0002'),
    )
    // eslint-disable-next-line no-control-regex -- \u0001 marks protected periods
    .map((s) => s.replace(/\u0001/g, '.').trim())
    .filter((s) => s.length > 0);
}

function clip(sentence: string, max = MAX_SENTENCE_CHARS): string {
  if (sentence.length <= max) return sentence;
  const cut = sentence.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** TextRank over the sentence-similarity graph (classic log-normalized overlap). */
function textRank(sets: ReadonlyArray<ReadonlySet<string>>): number[] {
  const n = sets.length;
  const weights: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    const si = sets[i];
    const wi = weights[i];
    if (!si || !wi) continue;
    for (let j = i + 1; j < n; j += 1) {
      const sj = sets[j];
      const wj = weights[j];
      if (!sj || !wj) continue;
      let inter = 0;
      for (const t of si) if (sj.has(t)) inter += 1;
      const denom = Math.log(si.size + 1) + Math.log(sj.size + 1);
      if (inter === 0 || denom === 0) continue;
      const weight = inter / denom;
      wi[j] = weight;
      wj[i] = weight;
    }
  }
  const outSum = weights.map((row) => row.reduce((s, x) => s + x, 0));
  const damping = 0.85;
  let rank: number[] = new Array<number>(n).fill(1 / n);
  for (let iter = 0; iter < 30; iter += 1) {
    const next: number[] = new Array<number>(n).fill((1 - damping) / n);
    for (let j = 0; j < n; j += 1) {
      const wj = weights[j];
      const rj = rank[j];
      const oj = outSum[j];
      if (!wj || rj === undefined || oj === undefined || oj === 0) continue;
      for (let i = 0; i < n; i += 1) {
        const weight = wj[i];
        const current = next[i];
        if (weight !== undefined && weight > 0 && current !== undefined) {
          next[i] = current + (damping * rj * weight) / oj;
        }
      }
    }
    rank = next;
  }
  return rank;
}

function normalize(values: number[]): number[] {
  const max = Math.max(...values, 0);
  return max > 0 ? values.map((v) => v / max) : values.map(() => 0);
}

/** Returns the most representative sentences, in original order. */
export function extractSentences(text: string, maxSentences = 6): string[] {
  const all = splitSentences(text);
  if (all.length <= maxSentences) return all.map((s) => clip(s));

  const total = all.length;
  const items = all
    .map((sentence, index) => ({
      sentence,
      index,
      tokens: new Set(contentTokens(sentence).map(stem)),
    }))
    .filter((i) => i.sentence.length >= MIN_SENTENCE_CHARS && i.tokens.size >= 3);

  if (items.length === 0) return all.slice(0, maxSentences).map((s) => clip(s));
  if (items.length <= maxSentences) return items.map((i) => clip(i.sentence));

  const freq = new Map<string, number>();
  for (const { tokens } of items) {
    for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  const tf = normalize(
    items.map(({ tokens }) => {
      let sum = 0;
      for (const t of tokens) sum += freq.get(t) ?? 0;
      return sum / tokens.size;
    }),
  );
  const graph = items.length <= MAX_GRAPH ? normalize(textRank(items.map((i) => i.tokens))) : null;

  const scored = items.map((item, k) => {
    const lead = 0.2 * (1 - item.index / total);
    const tfk = tf[k] ?? 0;
    const base = graph ? 0.5 * (graph[k] ?? 0) + 0.35 * tfk : 0.65 * tfk;
    const lengthPenalty = item.sentence.length > MAX_SENTENCE_CHARS ? 0.8 : 1;
    return { ...item, score: (base + lead) * lengthPenalty };
  });

  const selected: typeof scored = [];
  for (const candidate of scored.sort((a, b) => b.score - a.score)) {
    if (selected.length >= maxSentences) break;
    if (selected.some((s) => jaccard(s.tokens, candidate.tokens) > REDUNDANCY_THRESHOLD)) continue;
    selected.push(candidate);
  }

  return selected.sort((a, b) => a.index - b.index).map((s) => clip(s.sentence));
}

/** Bullets proportional to the text length when not specified. */
function defaultBullets(text: string): number {
  const words = countWords(text);
  if (words < 150) return 3;
  if (words < 400) return 5;
  if (words < 1000) return 6;
  return 8;
}

/** Bullet-style extractive summary (one sentence per line), capped. */
export function extractiveSummary(text: string, maxBullets?: number): string {
  const trimmed = text.trim();
  if (trimmed.length < 40) return trimmed;
  return extractSentences(trimmed, maxBullets ?? defaultBullets(trimmed))
    .map((s) => `• ${s}`)
    .join('\n');
}