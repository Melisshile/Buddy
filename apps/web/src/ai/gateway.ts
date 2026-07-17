import {
  createAIGateway,
  type AIGateway,
  type AIProviderAdapter,
  type GenerateRequest,
  type GenerateResponse,
} from '@buddy/shared';
import { getFirebaseApp, isFirebaseConfigured } from '../lib/firebase';

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'] as const;

function lastUserText(request: GenerateRequest): string {
  return [...request.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
}

function buildCoachingReply(q: string): string {
  const lower = q.toLowerCase();

  if (/what should i|today|work on|plan my/.test(lower)) {
    return [
      'Here is a focused plan for today:',
      '',
      '1. **20 min** — Embeddings: what they are + why RAG needs them',
      '2. **25 min** — Tiny TypeScript demo: embed 3 sentences and compare cosine similarity',
      '3. **10 min** — Write 3 quiz questions for yourself',
      '',
      'Say **“Teach me embeddings”** to start the lesson, or **“Quiz me on RAG”** when you are ready.',
    ].join('\n');
  }

  if (/teach me|explain|lesson/.test(lower)) {
    const topic = q.replace(/^(please\s+)?(teach me|explain|lesson on)\s+/i, '').trim() || 'this topic';
    return [
      `## Lesson: ${topic}`,
      '',
      '**Idea:** In AI systems, you turn messy input (text, code, docs) into something a model can reason over and retrieve.',
      '',
      '**Why it matters for Buddy:** better memory, better research, and better answers with citations.',
      '',
      '**3 steps**',
      '1. Define the concept in one sentence',
      '2. Name one failure mode if you skip it',
      '3. Point to where it belongs in Buddy’s architecture',
      '',
      '**Exercise:** In your own words, write one sentence defining it, then one sentence on how Buddy would use it.',
      '',
      'Reply with your answer and I will grade it. Or say **“make it easier”** / **“give me TypeScript”**.',
    ].join('\n');
  }

  if (/quiz me|test me|flashcard/.test(lower)) {
    return [
      '## Quick quiz',
      '',
      '1) What is an embedding?',
      '2) Why does RAG need a vector store?',
      '3) Name one way to evaluate retrieval quality.',
      '',
      'Answer in your own words. I will give feedback and a next lesson.',
    ].join('\n');
  }

  if (/remember/.test(lower)) {
    return 'Saved. I will treat that as a long-term preference for future coaching.';
  }

  if (/summarize|learned this week|this week/.test(lower)) {
    return [
      '## This week (coaching summary)',
      '',
      '- You are building Buddy as an AI-engineering learning companion',
      '- Core stack: Firebase + AI Gateway + voice-first UX + local-first memory',
      '- Next milestone: make sync + skill progression real, then RAG',
      '',
      'Want a quiz on embeddings, or a short architecture review of Buddy?',
    ].join('\n');
  }

  return [
    `I hear you: “${q}”`,
    '',
    'I am Buddy — your AI engineering coach. I can:',
    '- Plan your day (“What should I work on today?”)',
    '- Teach a topic (“Teach me embeddings”)',
    '- Quiz you (“Quiz me on RAG”)',
    '- Remember preferences (“Remember that I prefer TypeScript”)',
    '',
    'Ask me one of those, or tell me what you are stuck on in AI engineering.',
  ].join('\n');
}

/** Local coaching adapter — always available; used as primary fallback */
export function createMockAdapter(): AIProviderAdapter {
  return {
    name: 'coach',
    async generateResponse(request: GenerateRequest): Promise<GenerateResponse> {
      return {
        content: buildCoachingReply(lastUserText(request)),
        provider: 'coach',
        model: 'buddy-coach-v1',
      };
    },
  };
}

async function callGeminiModel(
  modelName: string,
  request: GenerateRequest,
): Promise<GenerateResponse> {
  const { getAI, getGenerativeModel, GoogleAIBackend } = await import('firebase/ai');
  const ai = getAI(getFirebaseApp(), { backend: new GoogleAIBackend() });
  const system = request.system ?? '';
  const model = getGenerativeModel(ai, {
    model: modelName,
    ...(system ? { systemInstruction: system } : {}),
  });

  const history = request.messages.filter((m) => m.role !== 'system');
  const prior = history.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));
  const latest = history[history.length - 1]?.content ?? 'Hello';

  // Gemini requires history to start with a user turn when present
  const safeHistory =
    prior.length > 0 && prior[0].role === 'model'
      ? [{ role: 'user' as const, parts: [{ text: '(continued)' }] }, ...prior]
      : prior;

  if (safeHistory.length === 0) {
    const result = await model.generateContent(latest);
    const content = result.response.text();
    if (!content?.trim()) throw new Error('Empty response from Gemini');
    return { content, provider: 'gemini', model: modelName };
  }

  const chat = model.startChat({ history: safeHistory });
  const result = await chat.sendMessage(latest);
  const content = result.response.text();
  if (!content?.trim()) throw new Error('Empty response from Gemini');
  return { content, provider: 'gemini', model: modelName };
}

export function createGeminiAdapter(): AIProviderAdapter {
  return {
    name: 'gemini',
    async generateResponse(request: GenerateRequest): Promise<GenerateResponse> {
      let lastError: unknown;
      for (const modelName of GEMINI_MODELS) {
        try {
          return await callGeminiModel(modelName, request);
        } catch (err) {
          lastError = err;
          console.warn(`[Buddy AI] Gemini model ${modelName} failed:`, err);
        }
      }
      const message =
        lastError instanceof Error ? lastError.message : 'Gemini request failed';
      throw new Error(message);
    },
  };
}

let gatewaySingleton: AIGateway | null = null;
let lastAiError: string | null = null;

export function getLastAiError(): string | null {
  return lastAiError;
}

export function clearLastAiError(): void {
  lastAiError = null;
}

export function getAIGateway(): AIGateway {
  if (gatewaySingleton) return gatewaySingleton;

  const forceMock = import.meta.env.VITE_USE_AI_MOCK === 'true' || !isFirebaseConfigured;
  const adapter = forceMock ? createMockAdapter() : createGeminiAdapter();
  gatewaySingleton = createAIGateway(adapter);
  return gatewaySingleton;
}

/**
 * Generate with Gemini when configured; on failure, fall back to local coach
 * and record the real error so the UI can show it.
 */
export async function generateViaGateway(request: GenerateRequest): Promise<GenerateResponse> {
  const gateway = getAIGateway();
  clearLastAiError();

  if (!navigator.onLine) {
    lastAiError = 'Offline — using local coach';
    return createMockAdapter().generateResponse(request);
  }

  try {
    return await gateway.generateResponse(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed';
    lastAiError = message;
    console.error('[Buddy AI]', message, err);
    // Keep coaching useful even when Firebase AI Logic is not enabled yet
    const fallback = await createMockAdapter().generateResponse(request);
    return {
      ...fallback,
      content: `${fallback.content}\n\n---\n_Note: Live Gemini failed (${message}). Enable Firebase AI Logic / Gemini in the console, then retry._`,
    };
  }
}
