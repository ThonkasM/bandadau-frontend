import type { LocalLlm } from './local-llm';
import { createExtractiveLlm } from './local-llm.fallback';

/**
 * Native factory (UC-17 §5.1). When `react-native-executorch` is added (requires an
 * `expo run:*` / EAS development build), return an `ExecutorchLlm` adapter here:
 * dynamic-import the runtime, wrap its download/progress/streaming/interrupt API behind
 * `LocalLlm`, and pick Qwen 3 0.6B / Llama 3.2 1B by RAM (`expo-device`). Until then the
 * pure-JS extractive fallback keeps the assistant usable offline.
 */
export function createLocalLlm(): LocalLlm {
  return createExtractiveLlm();
}
