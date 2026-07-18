import type { DigitalTwin } from '@buddy/shared';
import { getLocalDb } from '../sync/localDb';

const STORE = 'twin';

/** Seed tuned for the competition career-story demo (docs/DEMO_SCRIPT.md). */
export function defaultDigitalTwin(userId: string, displayName?: string | null): DigitalTwin {
  const now = Date.now();
  const inventoryId = crypto.randomUUID();
  return {
    userId,
    displayName: displayName?.trim() || 'Hilaire',
    headline: 'Computer systems engineering student · path to AI Engineer',
    preferredLanguages: ['TypeScript'],
    preferredFrameworks: ['React', 'Firebase'],
    skills: [
      { name: 'Authentication', level: 2, progress: 100, lastPracticedAt: now - 86400000 },
      { name: 'Firebase', level: 1, progress: 40, lastPracticedAt: now - 86400000 },
      { name: 'OpenAI', level: 1, progress: 25, lastPracticedAt: null },
      { name: 'AI Agents', level: 1, progress: 15, lastPracticedAt: null },
      { name: 'Deployment', level: 1, progress: 5, lastPracticedAt: null },
    ],
    projects: [
      {
        id: inventoryId,
        name: 'AI Engineering Path',
        description: 'Personal roadmap toward becoming an AI Engineer',
        status: 'active',
        progress: 42,
        stack: ['Firebase', 'OpenAI', 'TypeScript'],
        outstandingTasks: [
          'Finish Authentication module',
          'Start today’s build when ready',
        ],
        updatedAt: now,
      },
    ],
    education: ['Computer systems engineering student'],
    certificates: [],
    experience: ['Completed Authentication module yesterday'],
    goals: [
      {
        id: crypto.randomUUID(),
        title: 'Become an AI Engineer',
        status: 'active',
        priority: 1,
      },
    ],
    strengths: ['Systems thinking', 'Shipping under constraints', 'Firebase Auth'],
    weaknesses: ['AI Agents depth', 'Production evaluation'],
    interests: ['AI engineering', 'Career systems', 'OpenAI'],
    currentTasks: [
      {
        id: crypto.randomUUID(),
        title: 'Yesterday: Authentication ✓',
        done: true,
        projectId: inventoryId,
        dueLabel: 'yesterday',
      },
      {
        id: crypto.randomUUID(),
        title: 'Decide what to learn next',
        done: false,
        projectId: inventoryId,
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
