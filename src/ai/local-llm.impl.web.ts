import type {
  ChatMessage,
  GenerateOptions,
  LlmCapabilities,
  LlmStatus,
  LocalLlm,
  LocalModelId,
} from './local-llm';
import { MODELS } from './model-store';

/** Minimal shapes of the web runtime, so the bundle does not depend on its full typings. */
type ProgressReport = { progress?: number };
interface WebEngine {
  chat: { completions: { create(options: unknown): Promise<AsyncIterable<unknown>> } };
  interruptGenerate(): void;
  unload(): Promise<void>;
}
interface WebLlmModule {
  CreateMLCEngine(
    modelId: string,
    config?: { initProgressCallback?: (report: ProgressReport) => void },
  ): Promise<WebEngine>;
  hasModelInCache(modelId: string): Promise<boolean>;
  deleteModelAllInfoInCache(modelId: string): Promise<void>;
}

/** WebLLM prebuilt model ids (verified against the installed `@mlc-ai/web-llm`). */
const WEBLLM_MODELS: Record<LocalModelId, string> = {
  'qwen3-0.6b-q': 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
  'llama-3.2-1b-q': 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
  'web-fallback-small': 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
};

async function hasWebGpu(): Promise<boolean> {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
  if (!gpu) return false;
  try {
    return Boolean(await gpu.requestAdapter());
  } catch {
    return false;
  }
}

/**
 * Web UC-17 backend (`ia-local-y-offline.md` §5.2): WebLLM (WebGPU) with tokens streamed from the
 * engine. When WebGPU is missing, `StudyAssistant` degrades to the pure-JS extractive summary.
 *
 * The `transformers.js` WASM fallback of §5.2 is deferred: `@huggingface/transformers` pulls
 * `onnxruntime-web`, whose `import(/* webpackIgnore *\/ …)` breaks the Metro web export. It will be
 * re-enabled once that bundling issue is resolved (or loaded from a cached CDN chunk).
 */
class BrowserLlm implements LocalLlm {
  readonly backend = 'webllm' as const;
  private statusValue: LlmStatus = { kind: 'not-downloaded' };
  private readonly listeners = new Set<(status: LlmStatus) => void>();
  private engine: WebEngine | null = null;

  private emit(status: LlmStatus): void {
    this.statusValue = status;
    for (const listener of this.listeners) listener(status);
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
    if (await hasWebGpu()) {
      return { supported: true, recommended: { ...MODELS['qwen3-0.6b-q'], backend: 'webllm' } };
    }
    return { supported: false, recommended: null, reason: 'no-webgpu' };
  }

  async download(model: LocalModelId): Promise<void> {
    const webllm = (await import('@mlc-ai/web-llm').catch(() => null)) as unknown as WebLlmModule | null;
    if (!webllm || !(await hasWebGpu())) throw new Error('WebGPU is not available');
    this.emit({ kind: 'downloading', progress: 0 });
    this.engine = await webllm.CreateMLCEngine(WEBLLM_MODELS[model], {
      initProgressCallback: (report) =>
        this.emit({ kind: 'downloading', progress: report.progress ?? 0 }),
    });
    this.emit({ kind: 'ready' });
  }

  async load(model: LocalModelId): Promise<void> {
    if (this.engine) {
      this.emit({ kind: 'ready' });
      return;
    }
    const webllm = (await import('@mlc-ai/web-llm').catch(() => null)) as unknown as WebLlmModule | null;
    if (!webllm || !(await hasWebGpu())) return;
    // Only load from the browser cache: never download on its own (RNF-11).
    if (!(await webllm.hasModelInCache(WEBLLM_MODELS[model]).catch(() => false))) return;
    this.engine = await webllm.CreateMLCEngine(WEBLLM_MODELS[model]);
    this.emit({ kind: 'ready' });
  }

  async generate(messages: ChatMessage[], opts?: GenerateOptions): Promise<string> {
    if (!this.engine) throw new Error('assistant model is not ready');
    const stream = await this.engine.chat.completions.create({
      messages,
      stream: true,
      temperature: opts?.temperature ?? 0.2,
      max_tokens: opts?.maxTokens ?? 512,
    });
    let text = '';
    for await (const chunk of stream) {
      const delta =
        (chunk as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content ?? '';
      if (!delta) continue;
      text += delta;
      opts?.onToken?.(delta);
    }
    return text;
  }

  async unload(): Promise<void> {
    await this.engine?.unload();
    this.engine = null;
  }

  async remove(model: LocalModelId): Promise<void> {
    await this.unload();
    const webllm = (await import('@mlc-ai/web-llm').catch(() => null)) as unknown as WebLlmModule | null;
    await webllm?.deleteModelAllInfoInCache(WEBLLM_MODELS[model]).catch(() => undefined);
    this.emit({ kind: 'not-downloaded' });
  }
}

/** Web factory (UC-17 §5.2). Detection is lazy so the initial bundle stays small. */
export function createLocalLlm(): LocalLlm {
  return new BrowserLlm();
}
