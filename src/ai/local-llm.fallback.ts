import { extractiveSummary } from './extractive-summary';
import type {
  ChatMessage,
  GenerateOptions,
  LlmCapabilities,
  LlmStatus,
  LocalLlm,
} from './local-llm';

/**
 * Pure-JS fallback (UC-17 §5.2): extractive summary only, no model download, no network.
 * Keeps the assistant usable offline ("modo básico") on devices/browsers that cannot run a local
 * LLM. Flashcards are not offered in this mode (they need a real model).
 */
export function createExtractiveLlm(): LocalLlm {
  const listeners = new Set<(status: LlmStatus) => void>();
  const status: LlmStatus = { kind: 'unsupported', reason: 'extractive' };

  return {
    backend: 'extractive',
    async capabilities(): Promise<LlmCapabilities> {
      return { supported: false, recommended: null, reason: 'extractive' };
    },
    status: () => status,
    onStatus: (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    async download() {
      // Nothing to download: the fallback runs from the bundle.
    },
    async load() {
      // No weights to load.
    },
    async generate(messages: ChatMessage[], opts?: GenerateOptions): Promise<string> {
      const user = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
      const result = extractiveSummary(user);
      if (opts?.onToken) {
        // Emit token-by-token so the UI behaves the same as with a real model.
        for (const chunk of result.split(/(\s+)/)) {
          if (opts.signal?.aborted) break;
          opts.onToken(chunk);
          await new Promise((resolve) => setTimeout(resolve, 8));
        }
      }
      return result;
    },
    async unload() {
      // Stateless.
    },
    async remove() {
      // Stateless.
    },
  };
}
