import type { LLMChatSession, LLMModel } from 'react-native-executorch';

import type {
  ChatMessage,
  GenerateOptions,
  LlmCapabilities,
  LlmStatus,
  LocalLlm,
  LocalModelId,
} from './local-llm';
import { MODELS } from './model-store';

/** Minimal surface of `react-native-executorch` we rely on (kept loose for lazy loading). */
interface ExecuTorchModule {
  models: {
    llm: {
      LLAMA3_2_1B: { DEFAULT: LLMModel };
      QWEN2_5_0_5B: { DEFAULT: LLMModel };
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

/** Keeps a session only while its history is short (system + ~1 turn), then reloads a fresh one. */
const MAX_SESSION_MESSAGES = 4;

/** Maps our model ids to the curated `models.llm.*` registry of the installed runtime. */function registryModel(runtime: ExecuTorchModule, id: LocalModelId): LLMModel | null {
  const { llm } = runtime.models;
  switch (id) {
    case 'llama-3.2-1b-q':
      return llm.LLAMA3_2_1B.DEFAULT;
    case 'qwen3-0.6b-q':
      return llm.QWEN2_5_0_5B.DEFAULT;
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
 * `onToken`; `stop()` interrupts it. A session is reused while the system prompt is unchanged.
 */
class ExecutorchLlm implements LocalLlm {
  readonly backend = 'executorch' as const;
  private runtimePromise: Promise<ExecuTorchModule | null> | null = null;
  private statusValue: LlmStatus = { kind: 'not-downloaded' };
  private readonly listeners = new Set<(status: LlmStatus) => void>();
  private modelConfig: LLMModel | null = null;
  private session: LLMChatSession | null = null;
  private sessionSystem: string | null = null;

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
    this.emit({ kind: 'ready' });
  }

  async load(model: LocalModelId): Promise<void> {
    if (!this.modelConfig) await this.download(model);
    this.emit({ kind: 'ready' });
  }

  private async ensureSession(system: string): Promise<LLMChatSession> {
    const runtime = await this.runtime();
    if (!runtime || !this.modelConfig) throw new Error('assistant model is not ready');
    // Reuse only while the system prompt is unchanged and the history is short; otherwise start a
    // fresh context so a new summarize/flashcards run is not influenced by the previous one (the
    // flashcards retry still reuses the session, since its history is within the bound).
    const reusable =
      this.session &&
      this.sessionSystem === system &&
      this.session.getHistory().length <= MAX_SESSION_MESSAGES;
    if (reusable) return this.session as LLMChatSession;
    this.session?.dispose();
    this.session = await runtime.createLLMChatSession(this.modelConfig, {
      initialMessages: system ? [{ role: 'system', content: system }] : [],
      generationConfig: { maxNewTokens: 512, temperature: 0.2 },
    });
    this.sessionSystem = system;
    return this.session;
  }

  async generate(messages: ChatMessage[], opts?: GenerateOptions): Promise<string> {
    const system = messages.find((m) => m.role === 'system')?.content ?? '';
    const user = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const session = await this.ensureSession(system);
    const onAbort = () => session.stop();
    opts?.signal?.addEventListener('abort', onAbort);
    try {
      const result = await session.sendMessage(user, opts?.onToken, {
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
    this.sessionSystem = null;
  }

  async remove(): Promise<void> {
    await this.unload();
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
