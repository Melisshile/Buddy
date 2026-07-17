export type Persona = 'teacher' | 'mentor' | 'coding_partner';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  preferences: Record<string, string>;
  persona: Persona;
  createdAt: number;
  updatedAt: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  priority: number;
  createdAt: number;
  updatedAt: number;
}

export interface Skill {
  id: string;
  userId: string;
  name: string;
  level: number;
  progress: number;
  lastPracticedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Memory {
  id: string;
  userId: string;
  content: string;
  kind: 'preference' | 'fact' | 'learning' | 'reminder';
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  persona: Persona;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

export interface Lesson {
  id: string;
  userId: string;
  topic: string;
  content: string;
  exercise: string;
  createdAt: number;
}
