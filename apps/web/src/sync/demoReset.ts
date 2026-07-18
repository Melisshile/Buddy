import { defaultDigitalTwin, putTwin } from './twinDb';
import { closeLocalDb, getLocalDb, putProfile } from './localDb';
import { seedDefaults } from './syncEngine';

const DB_NAMES = ['buddy-v2', 'buddy-v1'] as const;

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error(`Failed to delete ${name}`));
    req.onblocked = () => resolve();
  });
}

/**
 * Presentation tool: wipe local Career Memory and reseed the competition demo state.
 * Caller should reload the page afterward so React state matches IndexedDB.
 */
export async function resetDemoState(opts: {
  userId: string;
  displayName?: string | null;
  email?: string | null;
}): Promise<void> {
  await closeLocalDb();

  for (const name of DB_NAMES) {
    try {
      await deleteDatabase(name);
    } catch {
      /* continue */
    }
  }

  const twin = defaultDigitalTwin(opts.userId, opts.displayName);
  await putTwin(twin);

  const now = Date.now();
  await putProfile({
    uid: opts.userId,
    email: opts.email ?? 'demo@buddy.local',
    displayName: opts.displayName ?? twin.displayName,
    preferences: {},
    persona: 'teacher',
    createdAt: now,
    updatedAt: now,
  });

  await seedDefaults(opts.userId);

  try {
    const db = await getLocalDb();
    await db.put('meta', { key: 'demo-reset-at', value: String(now) });
  } catch {
    /* ignore */
  }
}
