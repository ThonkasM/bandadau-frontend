/**
 * `LocalLlm` — on-device LLM abstraction for the study assistant (UC-17, D6).
 * The UI/services only depend on this interface; the concrete runtime is resolved per platform
 * via `./local-llm.impl` (Metro resolves `.native.ts` / `.web.ts`).
 */

export type LocalModelId = 'qwen3-0.6b-q' | 'llama-3.2-1b-q' | 'web-fallback-small';

export type LlmBackend = 'executorch' | 'webllm' | 'transformersjs' | 'extractive';

export interface LocalModelInfo {
  id: LocalModelId;
  displayName: string;
  sizeBytes: number;
  backend: LlmBackend;
}

export type LlmStatus =
  | { kind: 'not-downloaded' }
  | { kind: 'downloading'; progress: number }
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'unsupported'; reason: string }
  | { kind: 'error'; message: string };

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  /** Nucleus sampling. Honored by runtimes that expose it (WebLLM); ignored by ExecuTorch. */
  topP?: number;
  /** >1 discourages loops/repetition. Honored by WebLLM; ignored by ExecuTorch. */
  repetitionPenalty?: number;
  /** JSON Schema for constrained decoding (guarantees valid JSON where supported, e.g. WebLLM). */
  jsonSchema?: object;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

export interface LlmCapabilities {
  supported: boolean;
  recommended: LocalModelInfo | null;
  reason?: string;
}

export interface LocalLlm {
  /** Which runtime backs this instance (`extractive` = pure-JS fallback, summary only). */
  readonly backend: LlmBackend;
  capabilities(): Promise<LlmCapabilities>;
  status(): LlmStatus;
  onStatus(cb: (status: LlmStatus) => void): () => void;
  download(model: LocalModelId, opts?: { allowCellular?: boolean }): Promise<void>;
  load(model: LocalModelId): Promise<void>;
  generate(messages: ChatMessage[], opts?: GenerateOptions): Promise<string>;
  /**
   * Context window of the loaded model in tokens, or null while it is not known yet (the assistant
   * then sizes its chunks conservatively).
   */
  contextWindow?(): number | null;
  unload(): Promise<void>;
  remove(model: LocalModelId): Promise<void>;
}

export { createLocalLlm } from './local-llm.impl';
