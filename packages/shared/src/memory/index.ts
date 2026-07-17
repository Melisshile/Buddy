import type { Memory } from '../types/index.js';

export interface MemoryStore {
  storeMemory(input: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Memory>;
  retrieveRelevantKnowledge(query: string, limit?: number): Promise<Memory[]>;
  forget(id: string): Promise<void>;
  listMemories(): Promise<Memory[]>;
}

export function scoreMemoryRelevance(memory: Memory, query: string): number {
  const q = query.toLowerCase();
  const hay = `${memory.content} ${memory.tags.join(' ')} ${memory.kind}`.toLowerCase();
  if (!q.trim()) return 0;
  const terms = q.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const term of terms) {
    if (hay.includes(term)) score += 1;
  }
  return score;
}

export function createInMemoryStore(userId: string): MemoryStore {
  const items = new Map<string, Memory>();
  return {
    async storeMemory(input) {
      const now = Date.now();
      const memory: Memory = {
        id: input.id ?? crypto.randomUUID(),
        userId,
        content: input.content,
        kind: input.kind,
        tags: input.tags,
        createdAt: now,
        updatedAt: now,
      };
      items.set(memory.id, memory);
      return memory;
    },
    async retrieveRelevantKnowledge(query, limit = 8) {
      return [...items.values()]
        .map((m) => ({ m, score: scoreMemoryRelevance(m, query) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((x) => x.m);
    },
    async forget(id) {
      items.delete(id);
    },
    async listMemories() {
      return [...items.values()].sort((a, b) => b.updatedAt - a.updatedAt);
    },
  };
}
