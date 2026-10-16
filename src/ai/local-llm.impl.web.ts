import type { LocalLlm } from './local-llm';
import { createExtractiveLlm } from './local-llm.fallback';

/**
 * Web factory (UC-17 §5.2). When `@mlc-ai/web-llm` / `@huggingface/transformers` are added,
 * return a `WebLlmAdapter` (WebGPU, in a Web Worker) or a `TransformersJsAdapter` (WASM)
 * depending on `navigator.gpu`. Until then the pure-JS extractive fallback keeps the PWA
 * assistant usable offline.
 */
export function createLocalLlm(): LocalLlm {
  return createExtractiveLlm();
}
