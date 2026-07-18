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
  if (/become an? ai engineer|want to be(come)? an? ai engineer/.test(lower)) {
    return [
      '## Learning Plan',
      '',
      '| Week | Focus |',
      '|------|--------|',
      '| Week 1 | Firebase |',
      '| Week 2 | OpenAI APIs |',
      '| Week 3 | AI Agents |',
      '| Week 4 | Deployment |',
      '',
      "### Today's Goal",
      '**Build a Firebase Inventory App**',
      '',
      'You’re on the AI Engineer path. Yesterday you completed Authentication. Say **“Build today\'s project.”** to turn today’s goal into architecture and tasks.',
    ].join('\n');
  }
  if (/build today'?s project|today'?s project/.test(lower)) {
    return [
      '## Today’s project: Firebase Inventory App',
      '',
      '**Architecture** — React + TypeScript, Firebase Auth, Firestore inventory, Hosting.',
      '',
      '**Milestones** — data model → CRUD UI → security rules.',
      '',
      '**Timeline** — one focused session today.',
      '',
      'Career Twin updated. Return to the Dashboard to see progress and tasks.',
    ].join('\n');
  }
  if (/build|inventory|firebase app|create (an? )?app/.test(lower)) {
    return [
      '## Build plan',
      '',
      'Aligned to your AI Engineer goal: Firebase Inventory App with Auth, Firestore, and a demo screen.',
      '',
      'Prefer the career path: say **“I want to become an AI Engineer.”** then **“Build today\'s project.”**',
    ].join('\n');
  }
  if (/what should i|today|work on|plan my/.test(lower)) {
    return [
      'Based on your twin: you’re 42% through the AI Engineering roadmap.',
      'Next: set the career goal, then build today’s project.',
      '',
      'Say **“I want to become an AI Engineer.”**',
    ].join('\n');
  }
  if (/remember/.test(lower)) {
    return 'Saved to your Career Digital Twin preferences.';
  }
  return [
    `I hear you: “${q}”`,
    '',
    'I am Buddy — your AI Career Operating System.',
    'Try: **“I want to become an AI Engineer.”** then **“Build today\'s project.”**',
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
