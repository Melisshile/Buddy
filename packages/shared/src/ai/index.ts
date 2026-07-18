export type ChatRole = 'user' | 'assistant' | 'system';

export interface GatewayMessage {
  role: ChatRole;
  content: string;
}

export interface ToolParameterSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
}

export interface ToolDefinition {
  type: 'function';
  name: string;
  description: string;
  strict?: boolean;
  parameters: ToolParameterSchema;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface GenerateRequest {
  messages: GatewayMessage[];
  system?: string;
  tools?: ToolDefinition[];
  /** Prefer OpenAI Structured Outputs when set */
  jsonSchema?: {
    name: string;
    schema: Record<string, unknown>;
    strict?: boolean;
  };
  /** Override model (e.g. Codex for coding agent) */
  model?: string;
  stream?: boolean;
}

export interface GenerateResponse {
  content: string;
  provider: string;
  model: string;
  toolCalls?: ToolCall[];
  raw?: unknown;
}

export interface AIProviderAdapter {
  readonly name: string;
  generateResponse(request: GenerateRequest): Promise<GenerateResponse>;
}

export interface AIGateway {
  generateResponse(request: GenerateRequest): Promise<GenerateResponse>;
  setAdapter(adapter: AIProviderAdapter): void;
  getAdapterName(): string;
}

export function createAIGateway(initial: AIProviderAdapter): AIGateway {
  let adapter = initial;
  return {
    async generateResponse(request) {
      return adapter.generateResponse(request);
    },
    setAdapter(next) {
      adapter = next;
    },
    getAdapterName() {
      return adapter.name;
    },
  };
}

/** OpenAI model IDs for Build Week */
export const OPENAI_MODELS = {
  flagship: 'gpt-5.6',
  coding: 'gpt-5.2-codex',
  fast: 'gpt-5.6-luna',
} as const;
