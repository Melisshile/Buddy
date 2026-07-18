import {
  createAIGateway,
  OPENAI_MODELS,
  type AIGateway,
  type AIProviderAdapter,
  type GenerateRequest,
  type GenerateResponse,
} from '@buddy/shared';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { callOpenAIResponses } from './openaiClient';

function lastUserText(request: GenerateRequest): string {
  return [...request.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
}

function buildCoachingReply(q: string): string {
  const lower = q.toLowerCase();
  if (/build|inventory|firebase app|create (an? )?app/.test(lower)) {
    return [
      '## Agent plan (offline coach)',
      '',
      '1. **Career Agent** — Aligns this build with your AI Engineer goal',
      '2. **Project Manager** — Breaks work into Firebase Auth → Firestore inventory → Hosting',
      '3. **Coding Agent** — TypeScript + Firebase modular SDK scaffold',
      '4. **Research Agent** — Security rules + App Check checklist',
      '5. **Reviewer** — Demo readiness for OpenAI Build Week',
      '',
      '_Live OpenAI is offline or not configured — configure `OPENAI_API_KEY` / proxy to run GPT-5.6 + Codex._',
    ].join('\n');
  }
  if (/what should i|today|work on|plan my/.test(lower)) {
    return [
      'Focused plan for today:',
      '1. Continue your active project (25 min)',
      '2. One Learning Agent lesson on agents/tool calling (20 min)',
      '3. Update your Career Twin strengths/gaps (10 min)',
      '',
      'Say **“Continue my AI project”** or **“Build me a Firebase inventory app.”**',
    ].join('\n');
  }
  if (/remember/.test(lower)) {
    return 'Saved to your Career Digital Twin preferences.';
  }
  return [
    `I hear you: “${q}”`,
    '',
    'I am Buddy — your AI Career Operating System. I coordinate specialized agents powered by OpenAI.',
    'Try: “Build me a Firebase inventory app.” or “Continue my AI project.”',
  ].join('\n');
}

export function createMockAdapter(): AIProviderAdapter {
  return {
    name: 'coach',
    async generateResponse(request: GenerateRequest): Promise<GenerateResponse> {
      return {
        content: buildCoachingReply(lastUserText(request)),
        provider: 'coach',
        model: 'buddy-coach-v2',
      };
    },
  };
}

function resolveOpenAIOpts() {
  const proxyUrl = import.meta.env.VITE_OPENAI_PROXY_URL?.trim() || '';
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim() || '';
  return { proxyUrl, apiKey };
}

export function isOpenAIConfigured(): boolean {
  const { proxyUrl, apiKey } = resolveOpenAIOpts();
  return Boolean(proxyUrl || apiKey);
}

export function createOpenAIAdapter(): AIProviderAdapter {
  return {
    name: 'openai',
    async generateResponse(request: GenerateRequest): Promise<GenerateResponse> {
      const { proxyUrl, apiKey } = resolveOpenAIOpts();
      let idToken: string | null = null;
      if (proxyUrl && isFirebaseConfigured) {
        try {
          idToken = (await getFirebaseAuth().currentUser?.getIdToken()) ?? null;
        } catch {
          idToken = null;
        }
      }
      return callOpenAIResponses(
        {
          ...request,
          model: request.model ?? OPENAI_MODELS.flagship,
        },
        { proxyUrl: proxyUrl || undefined, apiKey: apiKey || undefined, idToken },
      );
    },
  };
}

/** @deprecated Gemini path kept for emergency fallback only — not used in Build Week default. */
export function createGeminiAdapter(): AIProviderAdapter {
  return {
    name: 'gemini-legacy',
    async generateResponse(): Promise<GenerateResponse> {
      throw new Error('Gemini is deprecated for Buddy AI 2.0 Build Week. Configure OpenAI.');
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

  const forceMock = import.meta.env.VITE_USE_AI_MOCK === 'true' || !isOpenAIConfigured();
  const adapter = forceMock ? createMockAdapter() : createOpenAIAdapter();
  gatewaySingleton = createAIGateway(adapter);
  return gatewaySingleton;
}

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
    const fallback = await createMockAdapter().generateResponse(request);
    return {
      ...fallback,
      content: `${fallback.content}\n\n---\n_Note: OpenAI failed (${message}). Set VITE_OPENAI_PROXY_URL or VITE_OPENAI_API_KEY._`,
    };
  }
}
