import type { DigitalTwin } from '@buddy/shared';
import { getLocalDb } from '../sync/localDb';

const STORE = 'twin';

export function defaultDigitalTwin(userId: string, displayName?: string | null): DigitalTwin {
  const now = Date.now();
  return {
    userId,
    displayName: displayName?.trim() || 'Hilaire',
    headline: 'AI Engineer in training · OpenAI Build Week',
    preferredLanguages: ['TypeScript'],
    preferredFrameworks: ['React', 'Firebase'],
    skills: [
      { name: 'Embeddings', level: 1, progress: 18, lastPracticedAt: null },
      { name: 'RAG', level: 1, progress: 12, lastPracticedAt: null },
      { name: 'Agents', level: 1, progress: 22, lastPracticedAt: null },
      { name: 'Firebase', level: 1, progress: 35, lastPracticedAt: null },
      { name: 'OpenAI', level: 1, progress: 28, lastPracticedAt: null },
    ],
    projects: [
      {
        id: crypto.randomUUID(),
        name: 'Buddy AI 2.0',
        description: 'AI Career Operating System for OpenAI Build Week',
        status: 'active',
        progress: 72,
        stack: ['React', 'Vite', 'Firebase', 'OpenAI Responses API'],
        outstandingTasks: [
          'Ship agent orchestrator demo',
          'Wire OpenAI proxy',
          'Polish dashboard for judges',
        ],
        updatedAt: now,
      },
    ],
    education: ['Self-taught AI engineering path'],
    certificates: [],
    experience: ['Building Buddy as a production-minded prototype'],
    goals: [
      {
        id: crypto.randomUUID(),
        title: 'Win OpenAI Build Week',
        status: 'active',
        priority: 1,
      },
      {
        id: crypto.randomUUID(),
        title: 'Become an AI Engineer',
        status: 'active',
        priority: 2,
      },
    ],
    strengths: ['Product focus', 'Shipping under constraints', 'Firebase'],
    weaknesses: ['DevOps depth', 'Formal evaluation pipelines'],
    interests: ['AI agents', 'Voice interfaces', 'Career systems'],
    currentTasks: [
      {
        id: crypto.randomUUID(),
        title: 'Continue Buddy AI',
        done: false,
        projectId: null,
        dueLabel: 'today',
      },
      {
        id: crypto.randomUUID(),
        title: 'Complete 2 tasks today',
        done: false,
        projectId: null,
        dueLabel: 'today',
      },
      {
        id: crypto.randomUUID(),
        title: 'Learn Firebase Agents',
        done: false,
        projectId: null,
        dueLabel: 'today',
      },
    ],
    careerRoadmapProgress: 42,
    updatedAt: now,
  };
}

export async function getTwin(userId: string): Promise<DigitalTwin | undefined> {
  const db = await getLocalDb();
  return db.get(STORE, userId);
}

export async function putTwin(twin: DigitalTwin): Promise<void> {
  const db = await getLocalDb();
  await db.put(STORE, twin);
}

export async function ensureTwin(userId: string, displayName?: string | null): Promise<DigitalTwin> {
  const existing = await getTwin(userId);
  if (existing) return existing;
  const twin = defaultDigitalTwin(userId, displayName);
  await putTwin(twin);
  return twin;
}
