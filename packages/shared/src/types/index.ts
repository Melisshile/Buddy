export type Persona = 'teacher' | 'mentor' | 'coding_partner';

export type AgentRole =
  | 'orchestrator'
  | 'career'
  | 'project_manager'
  | 'coding'
  | 'research'
  | 'learning'
  | 'document'
  | 'reviewer';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  preferences: Record<string, string>;
  persona: Persona;
  createdAt: number;
  updatedAt: number;
}

/** Career Digital Twin — persistent model of the user */
export interface DigitalTwin {
  userId: string;
  displayName: string;
  headline: string;
  preferredLanguages: string[];
  preferredFrameworks: string[];
  skills: TwinSkill[];
  projects: TwinProject[];
  education: string[];
  certificates: string[];
  experience: string[];
  goals: TwinGoal[];
  strengths: string[];
  weaknesses: string[];
  interests: string[];
  currentTasks: TwinTask[];
  careerRoadmapProgress: number;
  updatedAt: number;
}

export interface TwinSkill {
  name: string;
  level: number;
  progress: number;
  lastPracticedAt: number | null;
}

export interface TwinProject {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'done';
  progress: number;
  stack: string[];
  outstandingTasks: string[];
  updatedAt: number;
}

export interface TwinGoal {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'paused';
  priority: number;
}

export interface TwinTask {
  id: string;
  title: string;
  done: boolean;
  projectId: string | null;
  dueLabel?: string;
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
  kind: 'preference' | 'fact' | 'learning' | 'reminder' | 'project' | 'career';
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
  agentRole?: AgentRole;
  meta?: Record<string, unknown>;
}

export interface Lesson {
  id: string;
  userId: string;
  topic: string;
  content: string;
  exercise: string;
  createdAt: number;
}

export interface AgentStep {
  agent: AgentRole;
  summary: string;
  model?: string;
}

export interface OrchestrationResult {
  reply: string;
  steps: AgentStep[];
  twinPatch?: Partial<DigitalTwin>;
  provider: string;
  model: string;
  /** Demo / Developer Mode observability */
  metrics?: {
    responseMs: number;
    toolsExecuted: number;
    twinUpdated: boolean;
    memoryUpdated: boolean;
    agents: string[];
  };
}
