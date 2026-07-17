/**
 * Local AI Runtime stub — swap in Ollama / llama.cpp / browser WASM later.
 * Cloud remains the default in v1; this keeps the architecture boundary.
 */
export interface LocalAIRuntime {
  readonly isAvailable: boolean;
  canHandle(prompt: string): Promise<boolean>;
  generate(prompt: string): Promise<string>;
}

export function createLocalAIRuntimeStub(): LocalAIRuntime {
  return {
    isAvailable: false,
    async canHandle() {
      return false;
    },
    async generate() {
      throw new Error('Local AI Runtime is not wired in Buddy v1. Use cloud Gemini or mock adapter.');
    },
  };
}
