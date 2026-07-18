import { useEffect, useState } from 'react';
import type { DigitalTwin } from '@buddy/shared';
import { useAuth, useUserId } from '../auth/AuthProvider';
import { isOpenAIConfigured } from '../ai/gateway';
import { ensureTwin } from '../sync/twinDb';

function greetingName(name: string) {
  const hour = new Date().getHours();
  const hi = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return `${hi}, ${name}`;
}

export function Dashboard({ onOpenSession }: { onOpenSession: (seed?: string) => void }) {
  const { profile, logout, demoMode } = useAuth();
  const userId = useUserId();
  const [twin, setTwin] = useState<DigitalTwin | null>(null);

  useEffect(() => {
    if (!userId) return;
    void ensureTwin(userId, profile?.displayName).then(setTwin);
  }, [userId, profile?.displayName]);

  if (!twin) {
    return (
      <div className="min-h-screen bg-buddy-mesh flex items-center justify-center">
        <p className="font-display text-2xl text-white animate-pulse">Buddy</p>
      </div>
    );
  }

  const active = twin.projects.find((p) => p.status === 'active');
  const openTasks = twin.currentTasks.filter((t) => !t.done).slice(0, 3);
  const primaryGoal = twin.goals.find((g) => g.status === 'active');

  return (
    <div className="min-h-screen bg-buddy-mesh text-buddy-mist">
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div>
          <p className="font-display text-3xl text-white tracking-tight">Buddy</p>
          <p className="text-xs text-buddy-mist/50 mt-1">
            AI Career Operating System · Powered by OpenAI
            {demoMode ? ' · Demo' : ''}
            {!isOpenAIConfigured() ? ' · Coach fallback' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm text-buddy-mist/50 hover:text-white"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="font-display text-4xl md:text-5xl text-white mb-2">
          {greetingName(twin.displayName)}
        </h1>
        <p className="text-buddy-mist/65 mb-8 max-w-xl">{twin.headline}</p>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <button
            type="button"
            onClick={() => onOpenSession(`Continue working on ${active?.name ?? 'my AI project'}`)}
            className="text-left rounded-2xl border border-white/10 bg-buddy-slate/40 hover:border-buddy-glow/40 p-5 transition"
          >
            <p className="text-xs uppercase tracking-wider text-buddy-glow mb-2">Continue</p>
            <p className="font-display text-2xl text-white">{active?.name ?? 'Buddy AI'}</p>
            <p className="text-sm text-buddy-mist/55 mt-2">
              {active?.outstandingTasks[0] ?? 'Pick up where you left off'}
            </p>
          </button>

          <div className="rounded-2xl border border-white/10 bg-buddy-slate/40 p-5">
            <p className="text-xs uppercase tracking-wider text-buddy-glow mb-2">Today</p>
            <ul className="space-y-2">
              {openTasks.map((t) => (
                <li key={t.id} className="text-white/90 text-sm">
                  {t.title}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-white/10 bg-buddy-navy/50 p-5">
            <p className="text-xs uppercase tracking-wider text-buddy-mist/50 mb-2">Project progress</p>
            <p className="font-display text-4xl text-white">{active?.progress ?? 0}%</p>
            <div className="mt-3 h-2 rounded-full bg-buddy-slate overflow-hidden">
              <div
                className="h-full bg-buddy-accent"
                style={{ width: `${Math.min(100, active?.progress ?? 0)}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-buddy-navy/50 p-5">
            <p className="text-xs uppercase tracking-wider text-buddy-mist/50 mb-2">Current goal</p>
            <p className="font-display text-2xl text-white leading-snug">
              {primaryGoal?.title ?? 'Set a goal'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-buddy-navy/50 p-5">
            <p className="text-xs uppercase tracking-wider text-buddy-mist/50 mb-2">Career roadmap</p>
            <p className="font-display text-4xl text-white mb-2">{twin.careerRoadmapProgress}%</p>
            <div className="h-2 rounded-full bg-buddy-slate overflow-hidden">
              <div
                className="h-full bg-buddy-glow"
                style={{ width: `${twin.careerRoadmapProgress}%` }}
              />
            </div>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="font-display text-xl text-white mb-3">Career Digital Twin</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <p>
              <span className="text-buddy-mist/45">Languages · </span>
              {twin.preferredLanguages.join(', ')}
            </p>
            <p>
              <span className="text-buddy-mist/45">Frameworks · </span>
              {twin.preferredFrameworks.join(', ')}
            </p>
            <p>
              <span className="text-buddy-mist/45">Strengths · </span>
              {twin.strengths.join(', ')}
            </p>
            <p>
              <span className="text-buddy-mist/45">Grow next · </span>
              {twin.weaknesses.join(', ')}
            </p>
          </div>
          <ul className="mt-4 space-y-2">
            {twin.skills.slice(0, 5).map((s) => (
              <li key={s.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white">{s.name}</span>
                  <span className="text-buddy-mist/45">{s.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-buddy-slate overflow-hidden">
                  <div className="h-full bg-buddy-accent" style={{ width: `${s.progress}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onOpenSession('Build me a Firebase inventory app.')}
            className="rounded-xl bg-buddy-accent hover:bg-buddy-glow text-buddy-ink font-semibold py-3 px-5 transition"
          >
            Demo: Build inventory app
          </button>
          <button
            type="button"
            onClick={() => onOpenSession()}
            className="rounded-xl border border-buddy-mist/25 hover:border-buddy-glow/50 text-buddy-mist py-3 px-5 transition"
          >
            Open voice session
          </button>
        </div>
      </main>
    </div>
  );
}
