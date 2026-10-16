/**
 * Removes the light Markdown small models tend to add (`**bold**`, `_italic_`, `` `code` ``,
 * headings), so the UI never shows literal `**`/`_` markers. List markers become a `• ` bullet.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/```[^`]*```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1$2')
    .replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '$1')
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
    .replace(/^[ \t]*[-*+][ \t]+/gm, '• ')
    .replace(/[ \t]+$/gm, '')
    .trim();
}
