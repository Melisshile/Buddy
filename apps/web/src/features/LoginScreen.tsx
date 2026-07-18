import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { isFirebaseConfigured } from '../lib/firebase';

export function LoginScreen() {
  const { signInGoogle, signInDemo } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-buddy-mesh flex flex-col items-center justify-center px-6">
      <div className="fade-in max-w-lg w-full text-center">
        <p className="font-display text-5xl md:text-6xl text-white tracking-tight mb-3">Buddy</p>
        <p className="text-buddy-mist/80 text-lg mb-10 leading-relaxed">
          Your AI companion for becoming an AI Engineer — voice-first, offline-ready, built to grow with you.
        </p>
        <div className="flex flex-col gap-3 items-stretch max-w-xs mx-auto">
          {isFirebaseConfigured && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(signInGoogle)}
              className="rounded-xl bg-buddy-accent hover:bg-buddy-glow text-buddy-ink font-semibold py-3 px-5 transition disabled:opacity-50"
            >
              Continue with Google
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(signInDemo)}
            className="rounded-xl border border-buddy-mist/25 hover:border-buddy-glow/50 text-buddy-mist py-3 px-5 transition disabled:opacity-50"
          >
            {isFirebaseConfigured ? 'Continue anonymously / local coach' : 'Enter demo mode'}
          </button>
        </div>
        {error && <p className="mt-6 text-sm text-buddy-warn">{error}</p>}
        <p className="mt-8 text-sm text-buddy-mist/50">
          Powered by OpenAI · GPT-5.6 · Codex · Responses API
          {isFirebaseConfigured ? (
            <>
              {' '}
              · Firebase project <span className="text-buddy-glow">buddy-46cbb</span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
