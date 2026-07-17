export type VoiceIntent =
  | 'what_today'
  | 'teach'
  | 'quiz'
  | 'remember'
  | 'summarize_week'
  | 'general_chat';

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export interface SpeechRecognizer {
  start(): Promise<void>;
  stop(): Promise<void>;
  onResult(cb: (result: SpeechRecognitionResult) => void): void;
  onError(cb: (error: Error) => void): void;
  onEnd?(cb: () => void): void;
  readonly isSupported: boolean;
}

export interface SpeechSynthesizer {
  speak(text: string): Promise<void>;
  stop(): void;
  readonly isSupported: boolean;
}

export interface WakeWordDetector {
  start(): Promise<void>;
  stop(): Promise<void>;
  onWake(cb: () => void): void;
  readonly isSupported: boolean;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  at: number;
}

export interface ConversationManager {
  addUser(content: string): void;
  addAssistant(content: string): void;
  getHistory(limit?: number): ConversationTurn[];
  clear(): void;
}

export interface VoiceEngine {
  recognizer: SpeechRecognizer;
  synthesizer: SpeechSynthesizer;
  wakeWord: WakeWordDetector;
  conversation: ConversationManager;
  classifyIntent(transcript: string): VoiceIntent;
}

export function createConversationManager(): ConversationManager {
  const turns: ConversationTurn[] = [];
  return {
    addUser(content) {
      turns.push({ role: 'user', content, at: Date.now() });
    },
    addAssistant(content) {
      turns.push({ role: 'assistant', content, at: Date.now() });
    },
    getHistory(limit = 20) {
      return turns.slice(-limit);
    },
    clear() {
      turns.length = 0;
    },
  };
}

export function classifyVoiceIntent(transcript: string): VoiceIntent {
  const t = transcript.toLowerCase();
  if (/what should i (work on|do)|plan (my )?day|today/.test(t) && /work|focus|learn|plan|do/.test(t)) {
    return 'what_today';
  }
  if (/^teach me\b|\bteach me\b|\bexplain\b|\blesson on\b/.test(t)) {
    return 'teach';
  }
  if (/\bquiz me\b|\btest me\b|\bflashcard/.test(t)) {
    return 'quiz';
  }
  if (/\bremember that\b|\bremember i\b|\bnote that i\b/.test(t)) {
    return 'remember';
  }
  if (/summarize.*(week|learned)|what did i learn/.test(t)) {
    return 'summarize_week';
  }
  return 'general_chat';
}

/** Stub wake word — swap for OpenWakeWord later */
export function createStubWakeWord(): WakeWordDetector {
  let cb: (() => void) | null = null;
  return {
    isSupported: false,
    async start() {},
    async stop() {},
    onWake(handler) {
      cb = handler;
      void cb;
    },
  };
}
