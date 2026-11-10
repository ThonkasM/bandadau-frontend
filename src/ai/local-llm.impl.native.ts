import type { LLMChatSession, LLMModel } from 'react-native-executorch';

import type {
  ChatMessage,
  GenerateOptions,
  LlmCapabilities,
  LlmStatus,
  LocalLlm,
  LocalModelId,
} from './local-llm';
import {
  clearModelDownloaded,
  isModelDownloaded,
  markModelDownloaded,
} from './model-downloaded';
import { MODELS } from './model-store';

/** Minimal surface of `react-native-executorch` we rely on (kept loose for lazy loading). */
interface ExecuTorchModule {
  models: {
    llm: {
      LLAMA3_2_1B: { DEFAULT: LLMModel };
      QWEN3_0_6B: { DEFAULT: LLMModel };
    };
  };
  download<T>(source: T, options?: { onProgress?: (progress: number) => void }): Promise<T>;
  createLLMChatSession(
    config: LLMModel,
    options?: {
      initialMessages?: readonly ChatMessage[];
      generationConfig?: { maxNewTokens?: number; temperature?: number };
    },
  ): Promise<LLMChatSession>;
}

/** Maps our model ids to the curated `models.llm.*` registry of the installed runtime. */
function registryModel(runtime: ExecuTorchModule, id: LocalModelId): LLMModel | null {
  const { llm } = runtime.models;
  switch (id) {
    case 'llama-3.2-1b-q':
      return llm.LLAMA3_2_1B.DEFAULT;
    case 'qwen3-0.6b-q':
      return llm.QWEN3_0_6B.DEFAULT;
    default:
      return null;
  }
}

/**
 * Native UC-17 backend (ExecuTorch, `ia-local-y-offline.md` §5.1). Hook-free wrapper over the
 * imperative `createLLMChatSession` API. The runtime is imported lazily so the app still boots in
 * a build that does not link the native module (it degrades to the extractive fallback).
 *
 * `createLLMChatSession` runs generation on a background thread and streams tokens through
 * `onToken`; `stop()` interrupts it. A session is reused only for a true continuation of its conversation.
 */
class ExecutorchLlm implements LocalLlm {
  readonly backend = 'executorch' as const;
  private runtimePromise: Promise<ExecuTorchModule | null> | null = null;
  private statusValue: LlmStatus = { kind: 'not-downloaded' };
  private readonly listeners = new Set<(status: LlmStatus) => void>();
  private modelConfig: LLMModel | null = null;
  private session: LLMChatSession | null = null;
  /** `maxSeqLen` of the exported model, read from the first session (unknown until then). */
  private maxSeqLen: number | null = null;

  private emit(status: LlmStatus): void {
    this.statusValue = status;
    for (const listener of this.listeners) listener(status);
  }

  private runtime(): Promise<ExecuTorchModule | null> {
    this.runtimePromise ??= import('react-native-executorch')
      .then((mod) => mod as unknown as ExecuTorchModule)
      .catch(() => null);
    return this.runtimePromise;
  }

  status(): LlmStatus {
    return this.statusValue;
  }

  onStatus(cb: (status: LlmStatus) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  async capabilities(): Promise<LlmCapabilities> {
    const runtime = await this.runtime();
    if (!runtime) return { supported: false, recommended: null, reason: 'executorch-unavailable' };
    return {
      supported: true,
      recommended: { ...MODELS['llama-3.2-1b-q'], backend: 'executorch' },
    };
  }

  async download(model: LocalModelId): Promise<void> {
    const runtime = await this.runtime();
    if (!runtime) throw new Error('react-native-executorch is not linked in this build');
    const config = registryModel(runtime, model);
    if (!config) throw new Error(`unsupported model: ${model}`);
    this.emit({ kind: 'downloading', progress: 0 });
    // `download` caches the weights and resumes partial transfers (UC-17 §5.3).
    this.modelConfig = await runtime.download(config, {
      onProgress: (progress) => this.emit({ kind: 'downloading', progress }),
    });
    await markModelDownloaded(model);
    this.emit({ kind: 'ready' });
  }

  async load(model: LocalModelId): Promise<void> {
    if (this.modelConfig) {
      this.emit({ kind: 'ready' });
      return;
    }
    const runtime = await this.runtime();
    if (!runtime) return;
    // Only load from the local cache: if it was never downloaded, leave the status as
    // `not-downloaded` so the UI keeps offering the download (RNF-11: never download on its own).
    if (!(await isModelDownloaded(model))) return;
    const config = registryModel(runtime, model);
    if (!config) return;
    // Cache hit: resolves immediately without touching the network.
    this.modelConfig = await runtime.download(config);
    this.emit({ kind: 'ready' });
  }

  /**
   * The session is reused only when `prior` (every message before the one being sent) is exactly its
   * history: system + the same user turns, in order. That keeps the KV cache warm for the flashcards
   * retry / top-up, but a new chunk, a new text or a new run never inherits the previous context
   * (which used to leak earlier text into later summaries and cards).
   */
  private isContinuation(prior: readonly ChatMessage[]): boolean {
    if (!this.session) return false;
    const history = this.session.getHistory();
    if (history.length !== prior.length) return false;
    return prior.every((m, i) => {
      const h = history[i];
      if (!h || h.role !== m.role) return false;
      // Assistant turns may have been trimmed/re-serialized by the caller: the role match is enough.
      return m.role === 'assistant' || h.content === m.content;
    });
  }

  private async ensureSession(prior: readonly ChatMessage[]): Promise<LLMChatSession> {
    const runtime = await this.runtime();
    if (!runtime || !this.modelConfig) throw new Error('assistant model is not ready');
    if (this.session && this.isContinuation(prior)) return this.session;
    this.session?.dispose();
    this.session = null;
    this.session = await runtime.createLLMChatSession(this.modelConfig, {
      initialMessages: prior,
      generationConfig: { maxNewTokens: 512, temperature: 0.2 },
    });
    try {
      this.maxSeqLen = this.session.getKVCacheState().maxSeqLen || null;
    } catch {
      /* older runtimes: keep the conservative default */
    }
    return this.session;
  }

  contextWindow(): number | null {
    return this.maxSeqLen;
  }

  async generate(messages: ChatMessage[], opts?: GenerateOptions): Promise<string> {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user') throw new Error('the last message must come from the user');
    const session = await this.ensureSession(messages.slice(0, -1));
    const onAbort = () => session.stop();
    opts?.signal?.addEventListener('abort', onAbort);
    try {
      const result = await session.sendMessage(last.content, opts?.onToken, {
        maxNewTokens: opts?.maxTokens ?? 512,
        temperature: opts?.temperature ?? 0.2,
      });
      const answer = [...result.messages].reverse().find((m) => m.role === 'assistant');
      return typeof answer?.content === 'string' ? answer.content : '';
    } finally {
      opts?.signal?.removeEventListener('abort', onAbort);
    }
  }

  async unload(): Promise<void> {
    this.session?.dispose();
    this.session = null;
  }

  async remove(model: LocalModelId): Promise<void> {
    await this.unload();
    await clearModelDownloaded(model);
    this.modelConfig = null;
    this.emit({ kind: 'not-downloaded' });
  }
}

/**
 * Native factory (UC-17 §5.1). Once `react-native-executorch` is linked (a development build), the
 * assistant runs the on-device LLM; `StudyAssistant` degrades to the extractive fallback when the
 * model is not ready or the native runtime is missing.
 */
export function createLocalLlm(): LocalLlm {
  return new ExecutorchLlm();
}
