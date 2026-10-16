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
        'Resume el texto del usuario en 5 a 8 viñetas cortas, fieles al contenido. ' +
        'No inventes datos que no estén en el texto. Si el texto está vacío o no tiene sentido, ' +
        'responde: "No hay contenido suficiente para resumir."',
      userPrefix: '',
    },
    flashcards: {
      system:
        'Eres un generador de tarjetas de estudio. Respondes ÚNICAMENTE con JSON válido, sin texto ' +
        'adicional, con esta forma exacta: {"cards":[{"q":"pregunta","a":"respuesta breve"}]}. ' +
        'Genera entre 5 y 10 tarjetas a partir del texto. Preguntas claras, respuestas de máximo 25 ' +
        'palabras, en español. No incluyas información que no esté en el texto.',
      userPrefix: '',
    },
  },
  en: {
    summary: {
      system:
        'You are a study assistant for university students. Always answer in English. ' +
        'Summarize the user text in 5 to 8 short bullets, faithful to the content. Do not invent ' +
        'facts not present in the text. If the text is empty or meaningless, answer: ' +
        '"There is not enough content to summarize."',
      userPrefix: '',
    },
    flashcards: {
      system:
        'You are a study flashcard generator. Answer ONLY with valid JSON, no extra text, with this ' +
        'exact shape: {"cards":[{"q":"question","a":"short answer"}]}. Generate between 5 and 10 ' +
        'cards from the text. Clear questions, answers of at most 25 words, in English. Do not ' +
        'include information that is not in the text.',
      userPrefix: '',
    },
  },
};

/** Instruction sent on the single retry when the model returns non-JSON. */
export const FLASHCARD_RETRY: Record<Locale, string> = {
  es: 'Tu respuesta anterior no era JSON válido. Responde solo el JSON.',
  en: 'Your previous answer was not valid JSON. Reply with the JSON only.',
};

export function buildPrompt(kind: PromptKind, locale: Locale, text: string): string {
  const prompt = PROMPTS[locale] ?? PROMPTS.es;
  const { system, userPrefix } = prompt[kind];
  return `${system}\n\n${userPrefix}${text}`.trim();
}

export function promptSystem(kind: PromptKind, locale: Locale): string {
  return (PROMPTS[locale] ?? PROMPTS.es)[kind].system;
}
