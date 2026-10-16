import { extractiveSummary,extractSentences } from './extractive-summary';

const TEXT =
  'El sol es una estrella de tipo G. La Tierra gira alrededor del sol una vez al año. ' +
  'Marte es conocido como el planeta rojo por su óxido de hierro. ' +
  'Júpiter es el planeta más grande del sistema solar. ' +
  'La luna es el único satélite natural de la Tierra.';

describe('extractiveSummary', () => {
  it('returns the text unchanged when it is very short', () => {
    expect(extractiveSummary('corto')).toBe('corto');
  });

  it('produces at most N bullet lines', () => {
    const out = extractiveSummary(TEXT, 3);
    expect(out.startsWith('• ')).toBe(true);
    expect(out.split('\n')).toHaveLength(3);
  });

  it('keeps the original sentence order of the selection', () => {
    const sentences = extractSentences(TEXT, 3);
    const indexes = sentences.map((s) => TEXT.indexOf(s));
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
  });
});
