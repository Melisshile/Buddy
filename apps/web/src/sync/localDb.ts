import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ChatMessage, Conversation, Goal, Memory, Skill, UserProfile } from '@buddy/shared';

interface BuddyDB extends DBSchema {
  profile: {
    key: string;
    value: UserProfile;
  };
  goals: {
    key: string;
    value: Goal;
    indexes: { 'by-user': string };
  };
  skills: {
    key: string;
    value: Skill;
    indexes: { 'by-user': string };
  };
  memories: {
    key: string;
    value: Memory;
    indexes: { 'by-user': string };
  };
  conversations: {
    key: string;
    value: Conversation;
    indexes: { 'by-user': string };
  };
  messages: {
    key: string;
    value: ChatMessage;
    indexes: { 'by-conversation': string };
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

let dbPromise: Promise<IDBPDatabase<BuddyDB>> | null = null;

export function getLocalDb() {
  if (!dbPromise) {
    dbPromise = openDB<BuddyDB>('buddy-v1', 1, {
      upgrade(db) {
        db.createObjectStore('profile', { keyPath: 'uid' });
        const goals = db.createObjectStore('goals', { keyPath: 'id' });
        goals.createIndex('by-user', 'userId');
        const skills = db.createObjectStore('skills', { keyPath: 'id' });
        skills.createIndex('by-user', 'userId');
        const memories = db.createObjectStore('memories', { keyPath: 'id' });
        memories.createIndex('by-user', 'userId');
        const conversations = db.createObjectStore('conversations', { keyPath: 'id' });
        conversations.createIndex('by-user', 'userId');
        const messages = db.createObjectStore('messages', { keyPath: 'id' });
        messages.createIndex('by-conversation', 'conversationId');
        db.createObjectStore('meta', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

export async function putProfile(profile: UserProfile) {
  const db = await getLocalDb();
  await db.put('profile', profile);
}

export async function getProfile(uid: string) {
  const db = await getLocalDb();
  return db.get('profile', uid);
}

export async function putGoal(goal: Goal) {
  const db = await getLocalDb();
  await db.put('goals', goal);
}

export async function listGoals(userId: string) {
  const db = await getLocalDb();
  return db.getAllFromIndex('goals', 'by-user', userId);
}

export async function putSkill(skill: Skill) {
  const db = await getLocalDb();
  await db.put('skills', skill);
}

export async function listSkills(userId: string) {
  const db = await getLocalDb();
  return db.getAllFromIndex('skills', 'by-user', userId);
}

export async function putMemory(memory: Memory) {
  const db = await getLocalDb();
  await db.put('memories', memory);
}

export async function listMemories(userId: string) {
  const db = await getLocalDb();
  return db.getAllFromIndex('memories', 'by-user', userId);
}

export async function deleteMemoryLocal(id: string) {
  const db = await getLocalDb();
  await db.delete('memories', id);
}

export async function putConversation(conversation: Conversation) {
  const db = await getLocalDb();
  await db.put('conversations', conversation);
}

export async function putMessage(message: ChatMessage) {
  const db = await getLocalDb();
  await db.put('messages', message);
}

export async function listMessages(conversationId: string) {
  const db = await getLocalDb();
  return db.getAllFromIndex('messages', 'by-conversation', conversationId);
}
