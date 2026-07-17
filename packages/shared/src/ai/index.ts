export type ChatRole = 'user' | 'assistant' | 'system';

export interface GatewayMessage {
  role: ChatRole;
  content: string;
}

export interface GenerateRequest {
  messages: GatewayMessage[];
  system?: string;
  tools?: never[];
}

export interface GenerateResponse {
  content: string;
  provider: string;
  model: string;
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
