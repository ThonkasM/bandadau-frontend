import type { LocalModelId, LocalModelInfo } from './local-llm';

/**
 * Static manifest of the supported on-device models (UC-17 §5.3). Weights are NEVER bundled: they
 * are downloaded on demand by the runtime (ExecuTorch / WebLLM / transformers.js). Sizes are the
 * RNF-11 budget (≤ 1.5 GB) used for the free-space check (size × 1.2) and the Wi-Fi confirmation.
 */
export const MODELS: Record<LocalModelId, LocalModelInfo> = {
  'qwen3-0.6b-q': {
    id: 'qwen3-0.6b-q',
    displayName: 'Qwen 3 0.6B',
    sizeBytes: 400 * 1024 * 1024,
    backend: 'executorch',
  },
  'llama-3.2-1b-q': {
    id: 'llama-3.2-1b-q',
    displayName: 'Llama 3.2 1B',
    sizeBytes: 1_100 * 1024 * 1024,
    backend: 'executorch',
  },
  'web-fallback-small': {
    id: 'web-fallback-small',
    displayName: 'Modelo pequeño (web)',
    sizeBytes: 300 * 1024 * 1024,
    backend: 'transformersjs',
  },
};

/** Free space required to download a model (size × 1.2, UC-17 §5.3). */
export function requiredFreeBytes(model: LocalModelInfo): number {
  return Math.ceil(model.sizeBytes * 1.2);
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}
