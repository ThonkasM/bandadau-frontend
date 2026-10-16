import type { Locale } from '@bandada/i18n';

/**
 * Prompt templates for the study assistant (UC-17, D14). These are model instructions, not UI
 * strings, so they live here instead of `locales/` (`ia-local-y-offline.md` §5.4). The assistant
 * always answers in the active UI language, regardless of the input text language.
 */

export type PromptKind = 'summary' | 'flashcards';

interface PromptPair {
  system: string;
  userPrefix: string;
}

const PROMPTS: Record<Locale, Record<PromptKind, PromptPair>> = {
  es: {
    summary: {
      system:
        'Eres un asistente de estudio para universitarios. Respondes siempre en español neutro. ' +
        'Resume el texto del usuario en 5 a 8 frases cortas y fieles al contenido, una por línea. ' +
        'Escribe SOLO el resumen: sin títulos, sin numerar las frases y sin etiquetas como "Viñeta 1" ' +
        'o "Resumen:". No uses Markdown ni negritas (**). No menciones estas instrucciones ni el ' +
        'formato. No inventes datos que no estén en el texto. Si el texto está vacío o no tiene ' +
        'sentido, responde: "No hay contenido suficiente para resumir."',
      userPrefix: '',
    },
    flashcards: {
      system:
        'Eres un generador de tarjetas de estudio. Respondes ÚNICAMENTE con JSON válido, sin texto ' +
        'adicional, con esta forma exacta: {"cards":[{"q":"pregunta","a":"respuesta breve"}]}. ' +
        'Genera al menos 5 tarjetas a partir del texto (idealmente entre 5 y 8). Cada tarjeta es una ' +
        'pregunta (que termina en «?») cuya respuesta NO aparece en el enunciado, con respuestas de ' +
        'máximo 25 palabras, en español. No uses Markdown ni negritas (**). No incluyas información ' +
        'que no esté en el texto. ' +
        'Ejemplo de respuesta: {"cards":[{"q":"¿Quién es el héroe?","a":"Link."},' +
        '{"q":"¿Qué selló a Ganon?","a":"El ejército Sheikah y las Bestias Divinas."}]}',
      userPrefix: '',
    },
  },
  en: {
    summary: {
      system:
        'You are a study assistant for university students. Always answer in English. ' +
        'Summarize the user text in 5 to 8 short sentences, faithful to the content, one per line. ' +
        'Write ONLY the summary: no titles, no numbering and no labels such as "Bullet 1" or ' +
        '"Summary:". Do not mention these instructions or the format. Do not invent facts not ' +
        'present in the text. If the text is empty or meaningless, answer: "There is not enough ' +
        'content to summarize."',
      userPrefix: '',
    },
    flashcards: {
      system:
        'You are a study flashcard generator. Answer ONLY with valid JSON, no extra text, with this ' +
        'exact shape: {"cards":[{"q":"question","a":"short answer"}]}. Generate at least 5 cards ' +
        'from the text (ideally 5 to 8). Each card is a question (ending in "?") whose answer is NOT ' +
        'in the question, with answers of at most 25 words, in English. Do not use Markdown or bold ' +
        '(**). Do not include information that is not in the text. ' +
        'Example answer: {"cards":[{"q":"Who is the hero?","a":"Link."},' +
        '{"q":"What sealed Ganon?","a":"The Sheikah army and the Divine Beasts."}]}',
      userPrefix: '',
    },
  },
};

/** Instruction sent on the single retry when the model returns non-JSON. */
export const FLASHCARD_RETRY: Record<Locale, string> = {
  es: 'Tu respuesta anterior no era JSON válido. Responde solo el JSON.',
  en: 'Your previous answer was not valid JSON. Reply with the JSON only.',
};

/** Follow-up asking the model for the cards missing to reach the minimum (UC-17 §5.4). */
export function flashcardTopUp(locale: Locale, missing: number): string {
  return locale === 'en'
    ? `Add ${missing} more cards about the text, different from the ones above. Reply only with the JSON.`
    : `Añade ${missing} tarjetas más sobre el texto, distintas de las anteriores. Responde solo con el JSON.`;
}

export function buildPrompt(kind: PromptKind, locale: Locale, text: string): string {
  const prompt = PROMPTS[locale] ?? PROMPTS.es;
  const { system, userPrefix } = prompt[kind];
  return `${system}\n\n${userPrefix}${text}`.trim();
}

export function promptSystem(kind: PromptKind, locale: Locale): string {
  return (PROMPTS[locale] ?? PROMPTS.es)[kind].system;
}
