import { stripMarkdown } from './text';

describe('stripMarkdown', () => {
  it('removes bold/italic/code markers', () => {
    expect(stripMarkdown('**Hola** _mundo_ `code`')).toBe('Hola mundo code');
  });

  it('turns list markers into bullets and drops headings', () => {
    expect(stripMarkdown('# Título\n- uno\n- dos')).toBe('Título\n• uno\n• dos');
  });

  it('keeps underscores inside words', () => {
    expect(stripMarkdown('snake_case_name')).toBe('snake_case_name');
  });
});
