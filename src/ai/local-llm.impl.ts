import type { LocalLlm } from './local-llm';
import { createExtractiveLlm } from './local-llm.fallback';

/** Default (non-platform) factory. Metro picks `.native.ts` / `.web.ts` at build time. */
export function createLocalLlm(): LocalLlm {
  return createExtractiveLlm();
}
