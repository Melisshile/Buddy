import { useEffect, useState } from 'react';
import type { Goal, Skill } from '@buddy/shared';
import { useUserId } from '../auth/AuthProvider';
import { listGoals, listSkills } from '../sync/localDb';

export function SidebarPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const userId = useUserId();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    if (!userId || !open) return;
    void (async () => {
      setGoals(await listGoals(userId));
      setSkills(await listSkills(userId));
    })();
  }, [userId, open]);

  if (!open) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-buddy-navy/95 border-l border-white/10 backdrop-blur-md p-6 overflow-y-auto fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-white">Progress</h2>
        <button type="button" onClick={onClose} className="text-buddy-mist/70 hover:text-white">
          Close
        </button>
      </div>

      <section className="mb-8">
        <h3 className="text-sm uppercase tracking-wider text-buddy-glow mb-3">Goals</h3>
        <ul className="space-y-3">
          {goals.map((g) => (
            <li key={g.id} className="text-buddy-mist/90">
              <p className="font-medium text-white">{g.title}</p>
              <p className="text-sm text-buddy-mist/60">{g.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm uppercase tracking-wider text-buddy-glow mb-3">Skills</h3>
        <ul className="space-y-3">
          {skills.map((s) => (
            <li key={s.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white">{s.name}</span>
                <span className="text-buddy-mist/50">{s.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-buddy-slate overflow-hidden">
                <div className="h-full bg-buddy-accent" style={{ width: `${Math.min(100, s.progress)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
