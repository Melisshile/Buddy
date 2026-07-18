import type { DigitalTwin, ToolDefinition, TwinProject, TwinTask } from '@buddy/shared';

export const BUDDY_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    name: 'update_skill_progress',
    description: 'Update a skill progress percentage on the Career Digital Twin.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        skill: { type: 'string' },
        progress: { type: 'number' },
        delta: { type: 'number' },
      },
      required: ['skill', 'progress', 'delta'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'upsert_project',
    description: 'Create or update a project on the Digital Twin.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        progress: { type: 'number' },
        stack: { type: 'array', items: { type: 'string' } },
        outstandingTasks: { type: 'array', items: { type: 'string' } },
      },
      required: ['name', 'description', 'progress', 'stack', 'outstandingTasks'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'set_tasks',
    description: 'Replace or set current tasks for today.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              projectName: { type: 'string' },
            },
            required: ['title', 'projectName'],
            additionalProperties: false,
          },
        },
      },
      required: ['tasks'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'remember_preference',
    description: 'Store a lasting preference (language, framework, style).',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        value: { type: 'string' },
      },
      required: ['key', 'value'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'patch_career_insight',
    description: 'Add strengths, weaknesses, or interests to the Digital Twin.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        interests: { type: 'array', items: { type: 'string' } },
        roadmapProgress: { type: 'number' },
      },
      required: ['strengths', 'weaknesses', 'interests', 'roadmapProgress'],
      additionalProperties: false,
    },
  },
];

export function applyToolToTwin(
  twin: DigitalTwin,
  name: string,
  args: Record<string, unknown>,
): DigitalTwin {
  const next: DigitalTwin = {
    ...twin,
    skills: [...twin.skills],
    projects: twin.projects.map((p) => ({ ...p, outstandingTasks: [...p.outstandingTasks], stack: [...p.stack] })),
    currentTasks: [...twin.currentTasks],
    preferredLanguages: [...twin.preferredLanguages],
    preferredFrameworks: [...twin.preferredFrameworks],
    strengths: [...twin.strengths],
    weaknesses: [...twin.weaknesses],
    interests: [...twin.interests],
    updatedAt: Date.now(),
  };

  switch (name) {
    case 'update_skill_progress': {
      const skillName = String(args.skill ?? '');
      const progress = Number(args.progress ?? 0);
      const delta = Number(args.delta ?? 0);
      const idx = next.skills.findIndex((s) => s.name.toLowerCase() === skillName.toLowerCase());
      if (idx >= 0) {
        const s = next.skills[idx];
        next.skills[idx] = {
          ...s,
          progress: Math.min(100, Math.max(0, progress || s.progress + delta)),
          lastPracticedAt: Date.now(),
        };
      } else if (skillName) {
        next.skills.push({
          name: skillName,
          level: 1,
          progress: Math.min(100, Math.max(0, progress || delta)),
          lastPracticedAt: Date.now(),
        });
      }
      break;
    }
    case 'upsert_project': {
      const nameStr = String(args.name ?? 'Untitled');
      const existing = next.projects.findIndex((p) => p.name.toLowerCase() === nameStr.toLowerCase());
      const project: TwinProject = {
        id: existing >= 0 ? next.projects[existing].id : crypto.randomUUID(),
        name: nameStr,
        description: String(args.description ?? ''),
        status: 'active',
        progress: Number(args.progress ?? 0),
        stack: Array.isArray(args.stack) ? args.stack.map(String) : [],
        outstandingTasks: Array.isArray(args.outstandingTasks) ? args.outstandingTasks.map(String) : [],
        updatedAt: Date.now(),
      };
      if (existing >= 0) next.projects[existing] = project;
      else next.projects.unshift(project);
      break;
    }
    case 'set_tasks': {
      const tasks = Array.isArray(args.tasks) ? args.tasks : [];
      next.currentTasks = tasks.map((t): TwinTask => {
        const row = t as { title?: string; projectName?: string };
        const project = next.projects.find(
          (p) => p.name.toLowerCase() === String(row.projectName ?? '').toLowerCase(),
        );
        return {
          id: crypto.randomUUID(),
          title: String(row.title ?? 'Task'),
          done: false,
          projectId: project?.id ?? null,
        };
      });
      break;
    }
    case 'remember_preference': {
      const key = String(args.key ?? '').toLowerCase();
      const value = String(args.value ?? '');
      if (key.includes('language') || key === 'lang') {
        if (value && !next.preferredLanguages.includes(value)) next.preferredLanguages.push(value);
      } else if (key.includes('framework') || key.includes('stack')) {
        if (value && !next.preferredFrameworks.includes(value)) next.preferredFrameworks.push(value);
      }
      break;
    }
    case 'patch_career_insight': {
      const mergeUnique = (base: string[], add: unknown) => {
        const list = Array.isArray(add) ? add.map(String) : [];
        for (const x of list) if (x && !base.includes(x)) base.push(x);
      };
      mergeUnique(next.strengths, args.strengths);
      mergeUnique(next.weaknesses, args.weaknesses);
      mergeUnique(next.interests, args.interests);
      if (typeof args.roadmapProgress === 'number') {
        next.careerRoadmapProgress = Math.min(100, Math.max(0, args.roadmapProgress));
      }
      break;
    }
    default:
      break;
  }

  return next;
}
