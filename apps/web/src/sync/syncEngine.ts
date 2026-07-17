import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import type { Goal, Memory, Persona, Skill, UserProfile } from '@buddy/shared';
import { getDb, isFirebaseConfigured } from '../lib/firebase';
import {
  getProfile,
  listGoals,
  listMemories,
  listSkills,
  putGoal,
  putMemory,
  putProfile,
  putSkill,
} from './localDb';

function now() {
  return Date.now();
}

export async function ensureLocalProfile(uid: string, email: string | null, displayName: string | null) {
  const existing = await getProfile(uid);
  if (existing) return existing;

  const profile: UserProfile = {
    uid,
    email,
    displayName,
    preferences: {},
    persona: 'teacher',
    createdAt: now(),
    updatedAt: now(),
  };
  await putProfile(profile);

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(getDb(), 'users', uid), profile, { merge: true });
    } catch {
      // offline / rules — local still works
    }
  }
  return profile;
}

export async function updatePersona(uid: string, persona: Persona) {
  const profile = (await getProfile(uid)) ?? (await ensureLocalProfile(uid, null, null));
  const next = { ...profile, persona, updatedAt: now() };
  await putProfile(next);
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(getDb(), 'users', uid), { persona, updatedAt: next.updatedAt }, { merge: true });
    } catch {
      /* local-first */
    }
  }
  return next;
}

export async function seedDefaults(uid: string) {
  const goals = await listGoals(uid);
  if (goals.length === 0) {
    const goal: Goal = {
      id: crypto.randomUUID(),
      userId: uid,
      title: 'Become an AI Engineer',
      description: 'Learn embeddings, RAG, agents, evaluation, and platform architecture through Buddy.',
      status: 'active',
      priority: 1,
      createdAt: now(),
      updatedAt: now(),
    };
    await putGoal(goal);
    await pushGoal(goal);
  }

  const skills = await listSkills(uid);
  if (skills.length === 0) {
    const defaults: Omit<Skill, 'id'>[] = [
      { userId: uid, name: 'Embeddings', level: 1, progress: 10, lastPracticedAt: null, createdAt: now(), updatedAt: now() },
      { userId: uid, name: 'RAG', level: 1, progress: 5, lastPracticedAt: null, createdAt: now(), updatedAt: now() },
      { userId: uid, name: 'Agents', level: 1, progress: 0, lastPracticedAt: null, createdAt: now(), updatedAt: now() },
    ];
    for (const s of defaults) {
      const skill: Skill = { ...s, id: crypto.randomUUID() };
      await putSkill(skill);
      await pushSkill(skill);
    }
  }
}

async function pushGoal(goal: Goal) {
  if (!isFirebaseConfigured) return;
  try {
    await setDoc(doc(getDb(), 'goals', goal.id), goal, { merge: true });
  } catch {
    /* sync later */
  }
}

async function pushSkill(skill: Skill) {
  if (!isFirebaseConfigured) return;
  try {
    await setDoc(doc(getDb(), 'skills', skill.id), skill, { merge: true });
  } catch {
    /* sync later */
  }
}

export async function pushMemory(memory: Memory) {
  await putMemory(memory);
  if (!isFirebaseConfigured) return;
  try {
    await setDoc(doc(getDb(), 'memories', memory.id), memory, { merge: true });
  } catch {
    /* sync later */
  }
}

async function pullCollection<T extends { id: string }>(
  db: Firestore,
  name: string,
  userId: string,
  save: (item: T) => Promise<void>,
) {
  const snap = await getDocs(query(collection(db, name), where('userId', '==', userId)));
  for (const d of snap.docs) {
    await save({ id: d.id, ...d.data() } as T);
  }
}

/** Pull remote → local, then local remains source of truth for reads */
export async function syncFromCloud(uid: string) {
  if (!isFirebaseConfigured || !navigator.onLine) return;

  try {
    const db = getDb();
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists()) {
      await putProfile(userSnap.data() as UserProfile);
    }

    await pullCollection<Goal>(db, 'goals', uid, putGoal);
    await pullCollection<Skill>(db, 'skills', uid, putSkill);
    await pullCollection<Memory>(db, 'memories', uid, putMemory);
  } catch {
    // stay on local
  }
}

export async function pushAllLocal(uid: string) {
  if (!isFirebaseConfigured || !navigator.onLine) return;
  try {
    const profile = await getProfile(uid);
    if (profile) await setDoc(doc(getDb(), 'users', uid), profile, { merge: true });
    for (const g of await listGoals(uid)) await pushGoal(g);
    for (const s of await listSkills(uid)) await pushSkill(s);
    for (const m of await listMemories(uid)) {
      await setDoc(doc(getDb(), 'memories', m.id), m, { merge: true });
    }
  } catch {
    /* retry later */
  }
}

export async function fullSync(uid: string) {
  await syncFromCloud(uid);
  await pushAllLocal(uid);
}
