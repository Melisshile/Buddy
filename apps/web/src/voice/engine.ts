import {
  classifyVoiceIntent,
  createConversationManager,
  createStubWakeWord,
  type SpeechRecognitionResult,
  type SpeechRecognizer,
  type SpeechSynthesizer,
  type VoiceEngine,
} from '@buddy/shared';

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function createWebSpeechRecognizer(): SpeechRecognizer {
  const Ctor = getSpeechRecognitionCtor();
  let recognition: SpeechRecognition | null = null;
  let resultCb: ((r: SpeechRecognitionResult) => void) | null = null;
  let errorCb: ((e: Error) => void) | null = null;
  let endCb: (() => void) | null = null;

  return {
    isSupported: Boolean(Ctor),
    async start() {
      if (!Ctor) throw new Error('Speech recognition is not supported in this browser.');
      recognition = new Ctor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        const transcript = last?.[0]?.transcript ?? '';
        resultCb?.({ transcript, isFinal: last?.isFinal ?? false });
      };
      recognition.onerror = (event) => {
        errorCb?.(new Error(event.error || 'speech-recognition-error'));
      };
      recognition.onend = () => {
        endCb?.();
      };
      recognition.start();
    },
    async stop() {
      recognition?.stop();
      recognition = null;
    },
    onResult(cb) {
      resultCb = cb;
    },
    onError(cb) {
      errorCb = cb;
    },
    onEnd(cb) {
      endCb = cb;
    },
  };
}

export function createWebSpeechSynthesizer(): SpeechSynthesizer {
  return {
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    speak(text: string) {
      return new Promise((resolve, reject) => {
        if (!('speechSynthesis' in window)) {
          reject(new Error('Speech synthesis is not supported.'));
          return;
        }
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.02;
        utter.pitch = 1;
        let settled = false;
        const finish = (fn: () => void) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          fn();
        };
        const timer = window.setTimeout(() => finish(() => resolve()), 20000);
        utter.onend = () => finish(() => resolve());
        utter.onerror = () => finish(() => reject(new Error('tts-error')));
        window.speechSynthesis.speak(utter);
      });
    },
    stop() {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
  };
}

export function createVoiceEngine(): VoiceEngine {
  return {
    recognizer: createWebSpeechRecognizer(),
    synthesizer: createWebSpeechSynthesizer(),
    wakeWord: createStubWakeWord(),
    conversation: createConversationManager(),
    classifyIntent: classifyVoiceIntent,
  };
}
