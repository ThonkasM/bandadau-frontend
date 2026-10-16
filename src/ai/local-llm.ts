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
  unload(): Promise<void>;
  remove(model: LocalModelId): Promise<void>;
}

export { createLocalLlm } from './local-llm.impl';
