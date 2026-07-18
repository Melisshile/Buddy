import type { GenerateRequest, GenerateResponse, ToolCall, ToolDefinition } from '@buddy/shared';

const OPENAI_URL = 'https://api.openai.com/v1/responses';

function messagesToInput(request: GenerateRequest): unknown[] {
  const items: unknown[] = [];
  if (request.system) {
    items.push({
      role: 'system',
      content: [{ type: 'input_text', text: request.system }],
    });
  }
  for (const m of request.messages) {
    if (m.role === 'system') {
      items.push({
        role: 'system',
        content: [{ type: 'input_text', text: m.content }],
      });
      continue;
    }
    items.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: [
        {
          type: m.role === 'assistant' ? 'output_text' : 'input_text',
          text: m.content,
        },
      ],
    });
  }
  return items;
}

function mapTools(tools?: ToolDefinition[]) {
  if (!tools?.length) return undefined;
  return tools.map((t) => ({
    type: 'function' as const,
    name: t.name,
    description: t.description,
    strict: t.strict ?? true,
    parameters: t.parameters,
  }));
}

function extractText(data: Record<string, unknown>): string {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text;
  }
  const output = data.output;
  if (!Array.isArray(output)) return '';
  const chunks: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (row.type === 'message' && Array.isArray(row.content)) {
      for (const part of row.content) {
        if (part && typeof part === 'object') {
          const p = part as Record<string, unknown>;
          if (typeof p.text === 'string') chunks.push(p.text);
        }
      }
    }
  }
  return chunks.join('\n').trim();
}

function extractToolCalls(data: Record<string, unknown>): ToolCall[] {
  const output = data.output;
  if (!Array.isArray(output)) return [];
  const calls: ToolCall[] = [];
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (row.type === 'function_call') {
      let args: Record<string, unknown> = {};
      try {
        args =
          typeof row.arguments === 'string'
            ? (JSON.parse(row.arguments) as Record<string, unknown>)
            : ((row.arguments as Record<string, unknown>) ?? {});
      } catch {
        args = {};
      }
      calls.push({
        id: String(row.call_id ?? row.id ?? crypto.randomUUID()),
        name: String(row.name ?? ''),
        arguments: args,
      });
    }
  }
  return calls;
}

export interface OpenAICallOptions {
  apiKey?: string;
  proxyUrl?: string;
  /** Firebase Auth ID token for authenticated proxy */
  idToken?: string | null;
}

/**
 * Call OpenAI Responses API via Cloud Functions proxy, or directly with a
 * local API key (dev only — never ship client keys to production judges build).
 */
export async function callOpenAIResponses(
  request: GenerateRequest,
  opts: OpenAICallOptions,
): Promise<GenerateResponse> {
  const model = request.model ?? 'gpt-5.6';
  const body: Record<string, unknown> = {
    model,
    input: messagesToInput(request),
  };

  const tools = mapTools(request.tools);
  if (tools) body.tools = tools;

  if (request.jsonSchema) {
    body.text = {
      format: {
        type: 'json_schema',
        name: request.jsonSchema.name,
        strict: request.jsonSchema.strict ?? true,
        schema: request.jsonSchema.schema,
      },
    };
  }

  if (opts.proxyUrl) {
    const res = await fetch(opts.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.idToken ? { Authorization: `Bearer ${opts.idToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI proxy ${res.status}: ${errText.slice(0, 240)}`);
    }
    const data = (await res.json()) as Record<string, unknown>;
    return normalizeResponse(data, model);
  }

  if (!opts.apiKey) {
    throw new Error('No OpenAI proxy URL or API key configured');
  }

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 240)}`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  return normalizeResponse(data, model);
}

function normalizeResponse(data: Record<string, unknown>, model: string): GenerateResponse {
  const content = extractText(data);
  const toolCalls = extractToolCalls(data);
  if (!content && toolCalls.length === 0) {
    throw new Error('Empty response from OpenAI');
  }
  return {
    content: content || '(tool calls pending)',
    provider: 'openai',
    model: typeof data.model === 'string' ? data.model : model,
    toolCalls: toolCalls.length ? toolCalls : undefined,
    raw: data,
  };
}
