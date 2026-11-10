/**
 * Shared text helpers for the study assistant (pure JS, no runtime dependencies, no lookbehind so it
 * also runs on older WebViews/Safari).
 */

/** Lowercase, no accents, only [a-z0-9] separated by single spaces. Good for comparing/deduping. */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Removes the light Markdown small models tend to add (`**bold**`, `_italic_`, `` `code` ``,
 * headings, quotes, links), so the UI never shows literal `**`/`_` markers.
 * List markers become a `• ` bullet.
 */
export function stripMarkdown(text: string): string {
  return text
    // Qwen3 reasoning blocks must never reach the UI (thinking is disabled, this is a safety net).
    .replace(/<think>[\s\S]*?<\/think>\s*/gi, '')
    .replace(/<think>[\s\S]*$/i, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
    .replace(/^[ \t]*>[ \t]?/gm, '')
    // Bullets first, so a leading "* " is never mistaken for emphasis.
    .replace(/^[ \t]*[-*+][ \t]+/gm, '• ')
    .replace(/\*\*\*([^*\n]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1$2')
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1$2')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const STOPWORD_LIST = [
  // Spanish
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con',
  'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí',
  'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay',
  'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra',
  'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos',
  'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada',
  'muchos', 'cual', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros', 'mi',
  'es', 'son', 'fue', 'fueron', 'ser', 'han', 'era', 'eran', 'cada', 'según', 'puede', 'pueden',
  'tiene', 'tienen', 'esos', 'esas', 'así', 'solo', 'sólo', 'aunque', 'cómo', 'cuál', 'dónde',
  // English
  'the', 'an', 'of', 'to', 'and', 'in', 'is', 'it', 'that', 'for', 'on', 'with', 'as', 'are',
  'this', 'be', 'by', 'from', 'or', 'at', 'which', 'but', 'not', 'you', 'your', 'was', 'were',
  'have', 'has', 'had', 'can', 'will', 'their', 'its', 'than', 'then', 'these', 'those', 'into',
  'also', 'more', 'such', 'been', 'they', 'them', 'there', 'what', 'when', 'who', 'how', 'about',
];

/**
 * Stopwords, accent-folded. (The raw list contains accented words, but tokens are folded before
 * lookup, so the set must be folded too or "más", "qué", "sí"... would never match.)
 */
export const STOPWORDS: ReadonlySet<string> = new Set(STOPWORD_LIST.map(fold));

/** Very light stemmer for Spanish/English plurals: "datos"→"dato", "ciudades"→"ciudad". */
export function stem(token: string): string {
  if (token.length > 4 && /[dlrnz]es$/.test(token)) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

/** Folded content words (no stopwords, length >= 3). Not stemmed: apply `stem` where needed. */
export function contentTokens(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .match(/[a-z0-9]+/g);
  return (tokens ?? []).filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}