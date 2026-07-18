import { useState } from 'react';
import { useAuth, useUserId } from '../auth/AuthProvider';
import { resetDemoState } from '../sync/demoReset';

export type DevMetrics = {
  responseMs: number;
  toolsExecuted: number;
  twinUpdated: boolean;
  memoryUpdated: boolean;
  agents: string[];
  model: string;
  provider: string;
};

/** Hidden Developer Menu — metrics + Demo Reset (presentation tool, not a product feature). */
export function DeveloperModePanel({ metrics }: { metrics: DevMetrics | null }) {
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile, demoMode } = useAuth();
  const userId = useUserId();

  const onResetDemo = async () => {
    if (!userId || resetting) return;
    const ok = window.confirm(
      'Reset demo to the competition seed?\n\nThis clears local Career Memory, chats, and Growth Progress, then restores the 42% roadmap.',
    );
    if (!ok) return;
    setResetting(true);
    setError(null);
    try {
      await resetDemoState({
        userId,
        displayName: profile?.displayName,
        email: profile?.email,
      });
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reset failed');
      setResetting(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-white/10 text-buddy-mist/40 hover:text-buddy-mist/70 hover:border-white/20 bg-buddy-navy/80"
      >
        Developer Menu
      </button>
      {open && (
        <div className="mt-2 w-72 rounded-xl border border-white/10 bg-buddy-navy/95 p-3 text-xs text-buddy-mist/80">
          <p className="text-[10px] uppercase tracking-wider text-buddy-glow mb-2">Presentation</p>
          <button
            type="button"
            disabled={!userId || resetting}
            onClick={() => void onResetDemo()}
            className="w-full mb-3 rounded-lg border border-buddy-warn/40 text-buddy-warn py-2 px-3 hover:bg-buddy-warn/10 disabled:opacity-40"
          >
            {resetting ? 'Resetting…' : 'Reset Demo'}
          </button>
          <p className="text-[10px] text-buddy-mist/40 mb-3 leading-relaxed">
            Clears IndexedDB and reseeds 42% Growth Progress, Authentication win, and today&apos;s
            tasks. {demoMode ? 'Demo mode.' : ''}
          </p>
          {error && <p className="text-buddy-warn mb-2">{error}</p>}

          <p className="text-[10px] uppercase tracking-wider text-buddy-glow mb-2">Last turn</p>
          {!metrics ? (
            <p className="text-buddy-mist/40">Run a prompt to see metrics.</p>
          ) : (
            <dl className="space-y-1.5">
              <div className="flex justify-between gap-2">
                <dt className="text-buddy-mist/45">OpenAI model</dt>
                <dd className="text-white text-right break-all">{metrics.model}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-buddy-mist/45">Provider</dt>
                <dd className="text-white">{metrics.provider}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-buddy-mist/45">Agents used</dt>
                <dd className="text-white text-right">{metrics.agents.join(', ') || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-buddy-mist/45">Response time</dt>
                <dd className="text-white">{(metrics.responseMs / 1000).toFixed(1)} s</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-buddy-mist/45">Memory updated</dt>
                <dd className="text-white">{metrics.memoryUpdated ? '✓' : '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-buddy-mist/45">Twin updated</dt>
                <dd className="text-white">{metrics.twinUpdated ? '✓' : '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-buddy-mist/45">Tools executed</dt>
                <dd className="text-white">{metrics.toolsExecuted}</dd>
              </div>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
