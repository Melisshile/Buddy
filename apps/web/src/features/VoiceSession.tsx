import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { Persona } from '@buddy/shared';
import { useAuth, useUserId } from '../auth/AuthProvider';
import { createVoiceEngine } from '../voice/engine';
import {
  ensureConversation,
  generateBuddyReply,
  loadConversationHistory,
} from './companion';
import { getAIGateway, getLastAiError } from '../ai/gateway';
import { SidebarPanel } from './SidebarPanel';

type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: { agent: string; summary: string; model?: string }[];
};

const PERSONAS: { id: Persona; label: string }[] = [
  { id: 'teacher', label: 'Teacher' },
  { id: 'mentor', label: 'Mentor' },
  { id: 'coding_partner', label: 'Coding Partner' },
];

export function VoiceSession({
  seedPrompt,
  onBack,
}: {
  seedPrompt?: string;
  onBack?: () => void;
}) {
  const { profile, setPersona, logout, demoMode } = useAuth();
  const userId = useUserId();
  const engine = useMemo(() => createVoiceEngine(), []);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [interim, setInterim] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [agentChain, setAgentChain] = useState<{ agent: string; summary: string; model?: string }[]>([]);
  const conversationIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);

  const persona = profile?.persona ?? 'teacher';
  const provider = getAIGateway().getAdapterName();

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const id = await ensureConversation(userId, persona);
      conversationIdRef.current = id;
      const history = await loadConversationHistory(id);
      setMessages(
        history.map((h, i) => ({
          id: `${i}-${h.role}`,
          role: h.role,
          content: h.content,
        })),
      );
    })();
  }, [userId, persona]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interim, agentChain]);

  const handleUtterance = useCallback(
    async (transcript: string) => {
      if (!userId || !transcript.trim() || busy) return;
      const text = transcript.trim();
      setBusy(true);
      setError(null);
      setAgentChain([]);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'user', content: text }]);

      const intent = engine.classifyIntent(text);
      engine.conversation.addUser(text);

      try {
        const conversationId = conversationIdRef.current ?? (await ensureConversation(userId, persona));
        conversationIdRef.current = conversationId;
        const history = engine.conversation.getHistory(12).slice(0, -1);
        const result = await generateBuddyReply({
          userId,
          conversationId,
          transcript: text,
          intent,
          persona,
          history,
          displayName: profile?.displayName,
        });
        engine.conversation.addAssistant(result.content);
        if (result.agentSteps?.length) setAgentChain(result.agentSteps);
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: result.content,
            steps: result.agentSteps,
          },
        ]);

        const aiErr = getLastAiError();
        if (aiErr) setError(aiErr);

        if (engine.synthesizer.isSupported) {
          setSpeaking(true);
          void engine.synthesizer
            .speak(result.content.slice(0, 600))
            .catch(() => {
              /* ignore TTS failures */
            })
            .finally(() => setSpeaking(false));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Something went wrong';
        setError(msg);
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `I could not complete that request (${msg}). Check OpenAI proxy / API key configuration.`,
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [userId, busy, engine, persona, profile?.displayName],
  );

  useEffect(() => {
    if (!seedPrompt || !userId || seededRef.current) return;
    seededRef.current = true;
    void handleUtterance(seedPrompt);
  }, [seedPrompt, userId, handleUtterance]);

  const startListening = useCallback(async () => {
    setError(null);
    if (!engine.recognizer.isSupported) {
      setError('Speech recognition needs Chrome/Edge (or type below).');
      return;
    }
    engine.synthesizer.stop();
    setListening(true);
    setInterim('');
    engine.recognizer.onResult((r) => {
      setInterim(r.transcript);
      if (r.isFinal) {
        setInterim('');
        void handleUtterance(r.transcript);
      }
    });
    engine.recognizer.onError((err) => {
      setError(err.message);
      setListening(false);
    });
    engine.recognizer.onEnd?.(() => {
      setListening(false);
    });
    try {
      await engine.recognizer.start();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start mic');
      setListening(false);
    }
  }, [engine, handleUtterance]);

  const stopListening = useCallback(async () => {
    await engine.recognizer.stop();
    setListening(false);
  }, [engine]);

  const onSubmitText = (e: FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t) return;
    setInput('');
    void handleUtterance(t);
  };

  return (
    <div className="min-h-screen bg-buddy-mesh flex flex-col">
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div>
          <h1 className="font-display text-2xl text-white leading-none">Buddy</h1>
          <p className="text-xs text-buddy-mist/50 mt-1">
            {online ? 'Online' : 'Offline'} · AI: {provider === 'openai' ? 'OpenAI' : provider}
            {demoMode ? ' · Demo' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-sm px-3 py-1.5 rounded-lg border border-white/10 text-buddy-mist/80 hover:border-buddy-glow/40"
            >
              Dashboard
            </button>
          )}
          <button
            type="button"
            onClick={() => setSidebar(true)}
            className="text-sm px-3 py-1.5 rounded-lg border border-white/10 text-buddy-mist/80 hover:border-buddy-glow/40"
          >
            Progress
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-sm px-3 py-1.5 text-buddy-mist/50 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="px-5 pt-4 flex flex-wrap gap-2">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => void setPersona(p.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              persona === p.id
                ? 'border-buddy-glow bg-buddy-accent/20 text-buddy-glow'
                : 'border-white/10 text-buddy-mist/60 hover:border-white/25'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto px-5 py-6 max-w-2xl w-full mx-auto">
        {messages.length === 0 && (
          <div className="fade-in text-center py-10">
            <p className="font-display text-3xl text-white mb-3">Coordinate, don&apos;t just chat</p>
            <p className="text-buddy-mist/60 text-sm max-w-md mx-auto leading-relaxed">
              Try: &ldquo;Build me a Firebase inventory app.&rdquo; · &ldquo;Continue my AI project.&rdquo; ·
              &ldquo;Remember that I prefer TypeScript&rdquo;
            </p>
          </div>
        )}
        {(busy || agentChain.length > 0) && (
          <div className="mb-6 rounded-xl border border-buddy-glow/20 bg-buddy-navy/40 p-4">
            <p className="text-[10px] uppercase tracking-wider text-buddy-glow mb-2">Agent chain</p>
            <ol className="space-y-2 text-sm">
              {(agentChain.length
                ? agentChain
                : [{ agent: 'orchestrator', summary: 'Routing specialized agents…' }]
              ).map((s, i) => (
                <li key={`${s.agent}-${i}`} className="text-buddy-mist/85">
                  <span className="text-buddy-glow font-medium">{s.agent}</span>
                  {s.model ? <span className="text-buddy-mist/35"> · {s.model}</span> : null}
                  <span className="block text-buddy-mist/55 text-xs mt-0.5">{s.summary}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <ul className="space-y-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`fade-in whitespace-pre-wrap text-sm leading-relaxed ${
                m.role === 'user' ? 'text-buddy-glow/90' : 'text-buddy-mist/90'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-50 block mb-1">
                {m.role === 'user' ? 'You' : 'Buddy'}
              </span>
              {m.content}
            </li>
          ))}
        </ul>
        {interim && <p className="mt-4 text-buddy-mist/40 italic text-sm">{interim}</p>}
        {error && <p className="mt-4 text-buddy-warn text-sm">{error}</p>}
        <div ref={bottomRef} />
      </main>

      <footer className="px-5 pb-8 pt-3 max-w-2xl w-full mx-auto">
        <div className="flex flex-col items-center gap-4 mb-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => void (listening ? stopListening() : startListening())}
            className={`h-20 w-20 rounded-full flex items-center justify-center text-buddy-ink font-semibold transition ${
              listening || speaking ? 'buddy-pulse bg-buddy-glow' : 'bg-buddy-accent hover:bg-buddy-glow'
            } disabled:opacity-50`}
            aria-label={listening ? 'Stop listening' : 'Start talking'}
          >
            {busy ? '…' : listening ? 'Stop' : speaking ? '…' : 'Talk'}
          </button>
          <p className="text-xs text-buddy-mist/40">
            {listening ? 'Listening…' : speaking ? 'Speaking…' : busy ? 'Thinking…' : 'Tap to speak'}
          </p>
        </div>

        <form onSubmit={onSubmitText} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Or type a message…"
            className="flex-1 rounded-xl bg-buddy-slate/80 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-buddy-mist/30 focus:outline-none focus:border-buddy-glow/40"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-xl bg-buddy-slate border border-white/10 px-4 text-sm text-buddy-mist hover:border-buddy-glow/40 disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </footer>

      <SidebarPanel open={sidebar} onClose={() => setSidebar(false)} />
    </div>
  );
}
