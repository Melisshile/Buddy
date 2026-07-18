import {
  BUDDY_SYSTEM_PROMPT,
  PERSONA_PROMPTS,
  scoreMemoryRelevance,
  type ChatMessage,
  type Persona,
  type VoiceIntent,
} from '@buddy/shared';
import { runAgentOrchestra } from '../agents/orchestrator';
import { generateViaGateway, getLastAiError } from '../ai/gateway';
import { listGoals, listMemories, listMessages, listSkills, putConversation, putMessage } from '../sync/localDb';
import { pushMemory } from '../sync/syncEngine';
import { ensureTwin, putTwin } from '../sync/twinDb';

function weekAgo() {
  return Date.now() - 7 * 24 * 60 * 60 * 1000;
}

export async function buildContextBlock(userId: string, query: string): Promise<string> {
  const [goals, skills, memories] = await Promise.all([
    listGoals(userId),
    listSkills(userId),
    listMemories(userId),
  ]);

  const activeGoals = goals.filter((g) => g.status === 'active').slice(0, 5);
  const topSkills = [...skills].sort((a, b) => a.progress - b.progress).slice(0, 5);
  const relevant = memories
    .map((m) => ({ m, score: scoreMemoryRelevance(m, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.m);

  const prefs = memories.filter((m) => m.kind === 'preference').slice(0, 5);

  return [
    '## User context (local-first)',
    activeGoals.length
      ? `Goals:\n${activeGoals.map((g) => `- ${g.title}: ${g.description}`).join('\n')}`
      : 'Goals: none yet',
    topSkills.length
      ? `Skills (focus on lower progress):\n${topSkills.map((s) => `- ${s.name} (level ${s.level}, ${s.progress}%)`).join('\n')}`
      : 'Skills: none yet',
    prefs.length ? `Preferences:\n${prefs.map((p) => `- ${p.content}`).join('\n')}` : '',
    relevant.length ? `Relevant memories:\n${relevant.map((m) => `- [${m.kind}] ${m.content}`).join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function intentSystemAddon(intent: VoiceIntent, transcript: string): string {
  switch (intent) {
    case 'what_today':
      return 'The user asked what to work on today. Propose ONE concrete next action using their goals and skills. Mention timeboxing.';
    case 'teach':
      return `The user wants a short lesson. Topic hint from utterance: "${transcript}". Teach briefly, then give one exercise.`;
    case 'quiz':
      return `Quiz the user on the topic in their utterance (default embeddings/RAG if unclear). Ask 3 short questions; wait for answers.`;
    case 'remember':
      return 'Acknowledge the preference/fact. Confirm you will store it in long-term memory. Keep the reply short.';
    case 'summarize_week':
      return 'Summarize learning from the week context and memories. Suggest one next milestone.';
    default:
      return 'Respond as Buddy, the AI Career Operating System.';
  }
}

export async function extractAndStoreMemory(userId: string, transcript: string): Promise<void> {
  const match = transcript.match(/remember (?:that )?(.+)/i);
  const content = (match?.[1] ?? transcript).trim();
  if (!content) return;

  const memory = {
    id: crypto.randomUUID(),
    userId,
    content,
    kind: 'preference' as const,
    tags: ['voice', 'preference'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await pushMemory(memory);
}

export async function summarizeWeekLocal(userId: string): Promise<string> {
  const memories = await listMemories(userId);
  const recent = memories.filter((m) => m.createdAt >= weekAgo());
  if (recent.length === 0) {
    return 'No stored learnings from this week yet. Start a lesson with "Teach me embeddings".';
  }
  return recent.map((m) => `- ${m.content}`).join('\n');
}

export async function generateBuddyReply(opts: {
  userId: string;
  conversationId: string;
  transcript: string;
  intent: VoiceIntent;
  persona: Persona;
  history?: { role: 'user' | 'assistant'; content: string }[];
  displayName?: string | null;
}): Promise<{
  content: string;
  agentSteps?: { agent: string; summary: string; model?: string }[];
  metrics?: {
    responseMs: number;
    toolsExecuted: number;
    twinUpdated: boolean;
    memoryUpdated: boolean;
    agents: string[];
    model: string;
    provider: string;
  };
}> {
  const { userId, conversationId, transcript, intent, persona } = opts;

  if (intent === 'remember') {
    await extractAndStoreMemory(userId, transcript);
  }

  const twin = await ensureTwin(userId, opts.displayName);
  const orchestrated = await runAgentOrchestra({
    utterance: transcript,
    twin,
    history: opts.history,
  });

  if (orchestrated.twinPatch) {
    await putTwin({ ...twin, ...orchestrated.twinPatch, userId, updatedAt: Date.now() });
  }

  let content = orchestrated.reply;
  let memoryUpdated = intent === 'remember';

  // Lightweight intent overlays when orchestra returned a thin coach reply
  if (intent === 'summarize_week' && orchestrated.provider === 'coach') {
    const context = await buildContextBlock(userId, transcript);
    const weekExtra = await summarizeWeekLocal(userId);
    const system = [
      BUDDY_SYSTEM_PROMPT,
      PERSONA_PROMPTS[persona] ?? PERSONA_PROMPTS.teacher,
      intentSystemAddon(intent, transcript),
      context,
      `## Local weekly notes\n${weekExtra}`,
    ].join('\n\n');
    try {
      const result = await generateViaGateway({
        system,
        messages: [{ role: 'user', content: transcript }],
      });
      content = result.content;
    } catch {
      /* keep orchestra reply */
    }
  }

  void getLastAiError();

  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    conversationId,
    role: 'user',
    content: transcript,
    createdAt: Date.now(),
  };
  const assistantMsg: ChatMessage = {
    id: crypto.randomUUID(),
    conversationId,
    role: 'assistant',
    content,
    createdAt: Date.now() + 1,
    meta: { steps: orchestrated.steps, model: orchestrated.model, provider: orchestrated.provider },
  };
  await putMessage(userMsg);
  await putMessage(assistantMsg);

  if (intent === 'teach' || intent === 'quiz') {
    await pushMemory({
      id: crypto.randomUUID(),
      userId,
      content: `Session (${intent}): ${transcript.slice(0, 120)}`,
      kind: 'learning',
      tags: [intent, 'session'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    memoryUpdated = true;
  }

  return {
    content,
    agentSteps: orchestrated.steps,
    metrics: {
      responseMs: orchestrated.metrics?.responseMs ?? 0,
      toolsExecuted: orchestrated.metrics?.toolsExecuted ?? 0,
      twinUpdated: Boolean(orchestrated.metrics?.twinUpdated || orchestrated.twinPatch),
      memoryUpdated,
      agents: orchestrated.metrics?.agents ?? orchestrated.steps.map((s) => s.agent),
      model: orchestrated.model,
      provider: orchestrated.provider,
    },
  };
}

export async function ensureConversation(userId: string, persona: Persona) {
  const id = `main-${userId}`;
  await putConversation({
    id,
    userId,
    title: 'Buddy session',
    persona,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return id;
}

export async function loadConversationHistory(conversationId: string) {
  const msgs = await listMessages(conversationId);
  return msgs
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    .filter((m) => m.role === 'user' || m.role === 'assistant');
}
