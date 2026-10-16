/**
 * Extractive summarizer (pure JS, no runtime): the "modo básico" fallback of UC-17 when the
 * device/browser cannot run a local LLM (`ia-local-y-offline.md` §5.2). Frequency-based
 * (TextRank-lite): scores sentences by content-word frequency and keeps the top ones in order.
 * It only extracts; flashcards require a real model.
 */

const STOPWORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con',
  'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí',
  'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay',
  'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra',
  'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos',
  'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada',
  'muchos', 'cual', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros', 'mi',
  'the', 'a', 'an', 'of', 'to', 'and', 'in', 'is', 'it', 'that', 'for', 'on', 'with', 'as', 'are',
  'this', 'be', 'by', 'from', 'or', 'at', 'which', 'but', 'not', 'you', 'your',
]);

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+(?=[¿¡"«(]?[A-ZÁÉÍÓÚÑ0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function tokenize(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .match(/[a-z0-9]+/g) ?? [];
}

/** Returns the most representative sentences, in original order. */
export function extractSentences(text: string, maxSentences = 6): string[] {
  const sentences = splitSentences(text);
  if (sentences.length <= maxSentences) return sentences;

  const freq = new Map<string, number>();
  for (const sentence of sentences) {
    for (const token of tokenize(sentence)) {
      if (token.length < 3 || STOPWORDS.has(token)) continue;
      freq.set(token, (freq.get(token) ?? 0) + 1);
    }
  }

  const scored = sentences.map((sentence, index) => {
    const tokens = tokenize(sentence).filter((t) => t.length >= 3 && !STOPWORDS.has(t));
    const score = tokens.reduce((sum, t) => sum + (freq.get(t) ?? 0), 0) / (tokens.length || 1);
    return { index, sentence, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence);
}

/** Bullet-style extractive summary (one sentence per line), capped. */
export function extractiveSummary(text: string, maxBullets = 6): string {
  const trimmed = text.trim();
  if (trimmed.length < 40) return trimmed;
  return extractSentences(trimmed, maxBullets)
    .map((s) => `• ${s}`)
    .join('\n');
}
