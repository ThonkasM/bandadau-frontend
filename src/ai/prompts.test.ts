import { buildPrompt, promptSystem } from './prompts';

describe('buildPrompt', () => {
  it('includes the system instruction and the user text (es)', () => {
    const prompt = buildPrompt('summary', 'es', 'Hola mundo');
    expect(prompt).toContain('asistente de estudio');
    expect(prompt).toContain('Hola mundo');
  });

  it('uses the English template for en', () => {
    expect(buildPrompt('summary', 'en', 'x')).toContain('study assistant');
  });

  it('asks for JSON in the flashcards template', () => {
    expect(promptSystem('flashcards', 'es')).toContain('"cards"');
    expect(promptSystem('flashcards', 'en')).toContain('"cards"');
  });
});
