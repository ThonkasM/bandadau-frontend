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
    chatOpts?: { context_window_size?: number },
  ): Promise<WebEngine>;
  hasModelInCache(modelId: string): Promise<boolean>;
  deleteModelAllInfoInCache(modelId: string): Promise<void>;
}

/**
 * WebLLM prebuilt model ids (verified against the installed `@mlc-ai/web-llm`). `q4f16_1` needs the
 * WebGPU `shader-f16` feature; without it the same model is served as `q4f32_1` (bigger, same weights
 * family), so web keeps parity with native instead of silently switching models.
 */
const WEBLLM_MODELS: Record<LocalModelId, { f16: string; f32: string }> = {
  'qwen3-0.6b-q': { f16: 'Qwen3-0.6B-q4f16_1-MLC', f32: 'Qwen3-0.6B-q4f32_1-MLC' },
  'llama-3.2-1b-q': {
    f16: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    f32: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
  },
  'web-fallback-small': { f16: 'Qwen3-0.6B-q4f16_1-MLC', f32: 'Qwen3-0.6B-q4f32_1-MLC' },
};

interface GpuAdapter {
  features?: { has(name: string): boolean };
}

/** The WebGPU adapter, or null when WebGPU is missing. */
async function requestAdapter(): Promise<GpuAdapter | null> {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<GpuAdapter | null> } })
    .gpu;
  if (!gpu) return null;
  try {
    return (await gpu.requestAdapter()) ?? null;
  } catch {
    return null;
  }
}

/**
 * Context window requested from WebLLM. It matches the prebuilt override of Llama 3.2 1B, and is set
 * explicitly so every model has a known budget for chunking.
 */
const CONTEXT_WINDOW = 4096;
const CHAT_OPTS = { context_window_size: CONTEXT_WINDOW };

async function hasWebGpu(): Promise<boolean> {
  return (await requestAdapter()) !== null;
}

/** WebLLM id for `model` matching what this GPU supports. */
async function webllmId(model: LocalModelId): Promise<string> {
  const adapter = await requestAdapter();
  const ids = WEBLLM_MODELS[model];
  return adapter?.features?.has('shader-f16') ? ids.f16 : ids.f32;
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
  /** WebLLM id of the loaded engine (to pass model-specific options such as `enable_thinking`). */
  private engineModelId: string | null = null;

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
      return { supported: true, recommended: { ...MODELS['llama-3.2-1b-q'], backend: 'webllm' } };
    }
    return { supported: false, recommended: null, reason: 'no-webgpu' };
  }

  async download(model: LocalModelId): Promise<void> {
    const webllm = (await import('@mlc-ai/web-llm').catch(
      () => null,
    )) as unknown as WebLlmModule | null;
    if (!webllm || !(await hasWebGpu())) throw new Error('WebGPU is not available');
    this.emit({ kind: 'downloading', progress: 0 });
    const id = await webllmId(model);
    this.engine = await webllm.CreateMLCEngine(
      id,
      {
        initProgressCallback: (report) =>
          this.emit({ kind: 'downloading', progress: report.progress ?? 0 }),
      },
      CHAT_OPTS,
    );
    this.engineModelId = id;
    this.emit({ kind: 'ready' });
  }

  async load(model: LocalModelId): Promise<void> {
    if (this.engine) {
      this.emit({ kind: 'ready' });
      return;
    }
    const webllm = (await import('@mlc-ai/web-llm').catch(
      () => null,
    )) as unknown as WebLlmModule | null;
    if (!webllm || !(await hasWebGpu())) return;
    // Only load from the browser cache: never download on its own (RNF-11).
    const id = await webllmId(model);
    if (!(await webllm.hasModelInCache(id).catch(() => false))) return;
    this.engine = await webllm.CreateMLCEngine(id, undefined, CHAT_OPTS);
    this.engineModelId = id;
    this.emit({ kind: 'ready' });
  }

  contextWindow(): number | null {
    return this.engine ? CONTEXT_WINDOW : null;
  }

  async generate(messages: ChatMessage[], opts?: GenerateOptions): Promise<string> {
    const engine = this.engine;
    if (!engine) throw new Error('assistant model is not ready');
    const base: Record<string, unknown> = {
      messages,
      stream: true,
      temperature: opts?.temperature ?? 0.2,
      max_tokens: opts?.maxTokens ?? 512,
    };
    if (opts?.topP !== undefined) base.top_p = opts.topP;
    if (opts?.repetitionPenalty !== undefined) base.repetition_penalty = opts.repetitionPenalty;
    // Qwen3 has a "thinking" mode that prepends reasoning to the answer; we want the answer only.
    if (this.engineModelId?.startsWith('Qwen3')) base.extra_body = { enable_thinking: false };

    const run = async (request: Record<string, unknown>): Promise<string> => {
      const stream = await engine.chat.completions.create(request);
      let text = '';
      for await (const chunk of stream) {
        if (opts?.signal?.aborted) {
          engine.interruptGenerate();
          throw Object.assign(new Error('aborted'), { name: 'AbortError' });
        }
        const delta =
          (chunk as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta
            ?.content ?? '';
        if (!delta) continue;
        text += delta;
        opts?.onToken?.(delta);
      }
      return text;
    };

    if (opts?.jsonSchema) {
      // Constrained decoding makes the JSON valid by construction; if the engine rejects the
      // grammar, fall back to the unconstrained request (the tolerant parsers still apply).
      try {
        return await run({
          ...base,
          response_format: { type: 'json_object', schema: JSON.stringify(opts.jsonSchema) },
        });
      } catch (error) {
        if (opts.signal?.aborted) throw error;
      }
    }
    return run(base);
  }

  async unload(): Promise<void> {
    await this.engine?.unload();
    this.engine = null;
    this.engineModelId = null;
  }

  async remove(model: LocalModelId): Promise<void> {
    await this.unload();
    const webllm = (await import('@mlc-ai/web-llm').catch(
      () => null,
    )) as unknown as WebLlmModule | null;
    await webllm?.deleteModelAllInfoInCache(await webllmId(model)).catch(() => undefined);
    this.emit({ kind: 'not-downloaded' });
  }
}

/** Web factory (UC-17 §5.2). Detection is lazy so the initial bundle stays small. */
export function createLocalLlm(): LocalLlm {
  return new BrowserLlm();
}
