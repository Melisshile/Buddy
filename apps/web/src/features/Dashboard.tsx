import { useEffect, useState } from 'react';
import type { DigitalTwin } from '@buddy/shared';
import { useAuth, useUserId } from '../auth/AuthProvider';
import { isOpenAIConfigured } from '../ai/gateway';
import { ensureTwin } from '../sync/twinDb';

function greetingName(name: string) {
  return `Welcome back, ${name}`;
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
  const openTasks = twin.currentTasks.filter((t) => !t.done);
  const doneTasks = twin.currentTasks.filter((t) => t.done);
  const primaryGoal = twin.goals.find((g) => g.status === 'active');
  const nextSkill =
    [...twin.skills].filter((s) => s.progress < 100).sort((a, b) => a.progress - b.progress)[0]
      ?.name ?? 'AI Agents';
  const yesterdayWin =
    twin.experience.find((e) => /authentication/i.test(e)) ??
    (twin.skills.some((s) => s.name === 'Authentication' && s.progress >= 100)
      ? 'Yesterday you completed Authentication.'
      : null);

  return (
    <div className="min-h-screen bg-buddy-mesh text-buddy-mist">
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div>
          <p className="font-display text-3xl text-white tracking-tight">Buddy</p>
          <p className="text-xs text-buddy-mist/50 mt-1">
            Career Intelligence
            {isOpenAIConfigured() ? ' · Powered by OpenAI' : ' · Coach fallback'}
            {demoMode ? ' · Demo' : ''}
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
        <p className="text-buddy-mist/65 mb-2 max-w-xl">{twin.headline}</p>
        {yesterdayWin && (
          <p className="text-buddy-glow/90 text-sm mb-8 max-w-xl">{yesterdayWin}</p>
        )}

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="rounded-2xl border border-white/10 bg-buddy-navy/50 p-5">
            <p className="text-xs uppercase tracking-wider text-buddy-mist/50 mb-2">Growth Progress</p>
            <p className="font-display text-4xl text-white mb-2">{twin.careerRoadmapProgress}%</p>
            <p className="text-sm text-buddy-mist/55 mb-3">AI Engineering roadmap</p>
            <div className="h-2 rounded-full bg-buddy-slate overflow-hidden">
              <div
                className="h-full bg-buddy-glow"
                style={{ width: `${twin.careerRoadmapProgress}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-buddy-navy/50 p-5">
            <p className="text-xs uppercase tracking-wider text-buddy-mist/50 mb-2">Current goal</p>
            <p className="font-display text-2xl text-white leading-snug">
              {primaryGoal?.title ?? 'Set a goal'}
            </p>
            {active && (
              <p className="text-sm text-buddy-mist/50 mt-3">
                Project · {active.name} · {active.progress}%
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-buddy-navy/50 p-5">
            <p className="text-xs uppercase tracking-wider text-buddy-mist/50 mb-2">Next skill</p>
            <p className="font-display text-2xl text-white">{nextSkill}</p>
            <p className="text-sm text-buddy-mist/50 mt-3">Grow this next on your twin</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-white/10 bg-buddy-slate/40 p-5">
            <p className="text-xs uppercase tracking-wider text-buddy-glow mb-3">Today&apos;s tasks</p>
            <ul className="space-y-2 text-sm">
              {doneTasks.map((t) => (
                <li key={t.id} className="text-buddy-mist/55">
                  ✓ {t.title.replace(/^Yesterday:\s*/i, '')}
                </li>
              ))}
              {openTasks.map((t) => (
                <li key={t.id} className="text-white/90">
                  ○ {t.title}
                </li>
              ))}
              {twin.currentTasks.length === 0 && (
                <li className="text-buddy-mist/45">No tasks yet — start your career path</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-buddy-slate/40 p-5">
            <p className="text-xs uppercase tracking-wider text-buddy-glow mb-3">Career Memory</p>
            <p className="text-sm mb-2">
              <span className="text-buddy-mist/45">Strengths · </span>
              {twin.strengths.join(', ')}
            </p>
            <p className="text-sm mb-4">
              <span className="text-buddy-mist/45">Grow next · </span>
              {twin.weaknesses.join(', ')}
            </p>
            <ul className="space-y-2">
              {twin.skills.slice(0, 4).map((s) => (
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
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onOpenSession('I want to become an AI Engineer.')}
            className="rounded-xl bg-buddy-accent hover:bg-buddy-glow text-buddy-ink font-semibold py-3 px-5 transition"
          >
            Start career path
          </button>
          <button
            type="button"
            onClick={() => onOpenSession("Build today's project.")}
            className="rounded-xl border border-buddy-mist/25 hover:border-buddy-glow/50 text-buddy-mist py-3 px-5 transition"
          >
            Build today&apos;s project
          </button>
        </div>
        <p className="mt-6 text-sm text-buddy-mist/40 max-w-lg">
          Buddy doesn&apos;t just answer questions. It helps you learn, build, and grow throughout
          your career.
        </p>
      </main>
    </div>
  );
}
