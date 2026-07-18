import {
  AGENT_LABELS,
  BUDDY_SYSTEM_PROMPT,
  OPENAI_MODELS,
  type AgentRole,
  type AgentStep,
  type DigitalTwin,
  type OrchestrationResult,
} from '@buddy/shared';
import { generateViaGateway } from '../ai/gateway';
import { applyToolToTwin, BUDDY_TOOLS } from './tools';

const BUILD_INTENT = /build|create|make|scaffold|inventory|app for|implement/i;
const BUILD_TODAY_INTENT = /build today'?s project|today'?s project|start today'?s build/i;
const BECOME_ENGINEER_INTENT =
  /become an? ai engineer|want to be(come)? an? ai engineer|path to (becoming )?an? ai engineer/i;
const CONTINUE_INTENT = /continue|resume|keep (working|going)|my (ai )?project/i;
const LEARN_INTENT = /teach|learn|quiz|lesson/i;
const CAREER_INTENT = /career|job|portfolio|roadmap|interview/i;

function pickChain(utterance: string): AgentRole[] {
  if (BECOME_ENGINEER_INTENT.test(utterance)) {
    return ['orchestrator', 'career', 'learning', 'project_manager', 'reviewer'];
  }
  if (BUILD_TODAY_INTENT.test(utterance) || BUILD_INTENT.test(utterance)) {
    return ['orchestrator', 'career', 'project_manager', 'coding', 'reviewer'];
  }
  if (CONTINUE_INTENT.test(utterance)) {
    return ['orchestrator', 'project_manager', 'coding', 'reviewer'];
  }
  if (CAREER_INTENT.test(utterance)) {
    return ['orchestrator', 'career', 'learning', 'reviewer'];
  }
  if (LEARN_INTENT.test(utterance)) {
    return ['orchestrator', 'learning', 'career', 'reviewer'];
  }
  return ['orchestrator', 'career', 'project_manager', 'reviewer'];
}

function twinContext(twin: DigitalTwin): string {
  const active = twin.projects.find((p) => p.status === 'active');
  const openTasks = twin.currentTasks.filter((t) => !t.done).slice(0, 5);
  return [
    '## Career Digital Twin',
    `Name: ${twin.displayName}`,
    `Headline: ${twin.headline}`,
    `Languages: ${twin.preferredLanguages.join(', ') || 'unspecified'}`,
    `Frameworks: ${twin.preferredFrameworks.join(', ') || 'unspecified'}`,
    `Roadmap: ${twin.careerRoadmapProgress}%`,
    `Skills: ${twin.skills.map((s) => `${s.name} ${s.progress}%`).join('; ') || 'none'}`,
    active
      ? `Active project: ${active.name} (${active.progress}%) — tasks: ${active.outstandingTasks.join('; ') || 'none'}`
      : 'Active project: none',
    openTasks.length
      ? `Current tasks:\n${openTasks.map((t) => `- ${t.title}`).join('\n')}`
      : 'Current tasks: none',
    `Goals: ${twin.goals.map((g) => g.title).join('; ') || 'none'}`,
    `Strengths: ${twin.strengths.join('; ') || 'emerging'}`,
    `Gaps: ${twin.weaknesses.join('; ') || 'to discover'}`,
  ].join('\n');
}

const AGENT_INSTRUCTIONS: Partial<Record<AgentRole, string>> = {
  career:
    'You are the Career Agent. Connect this request to career goals, portfolio gaps, and next skills. Suggest how this work improves employability.',
  project_manager:
    'You are the Project Manager Agent. Break the request into sequenced milestones and concrete tasks. Prefer 3–5 tasks.',
  coding:
    'You are the Coding Agent (Codex). Propose architecture and TypeScript/Firebase implementation outline. Be specific about files and APIs. Prefer actionable steps over essays.',
  research:
    'You are the Research Agent. Surface risks, best practices, security rules, and OpenAI/Firebase constraints relevant to the plan.',
  learning:
    'You are the Learning Agent. Teach briefly and attach one exercise tied to the user twin.',
  document:
    'You are the Document Agent. Structure docs, README sections, or diagrams the user needs.',
  reviewer:
    'You are the Reviewer. Critique the plan for Build Week demo quality. Name one memorable demo moment.',
  orchestrator:
    'You are the Orchestrator. Route work across agents and synthesize a coherent plan.',
};

/**
 * Multi-agent orchestration for Buddy AI 2.0.
 * OpenAI Responses API + tool calling (strict). Structured plan summaries
 * are produced in a second lightweight pass when OpenAI is live.
 */
export async function runAgentOrchestra(opts: {
  utterance: string;
  twin: DigitalTwin;
  history?: { role: 'user' | 'assistant'; content: string }[];
}): Promise<OrchestrationResult> {
  const chain = pickChain(opts.utterance);
  const steps: AgentStep[] = chain
    .filter((a) => a !== 'orchestrator')
    .map((agent) => ({
      agent,
      summary: `${AGENT_LABELS[agent]} standing by`,
      model: agent === 'coding' ? OPENAI_MODELS.coding : OPENAI_MODELS.flagship,
    }));

  const system = [
    BUDDY_SYSTEM_PROMPT,
    twinContext(opts.twin),
    'Coordinate these agents in order: ' + chain.map((a) => AGENT_LABELS[a] ?? a).join(' → '),
    ...chain.map((a) => AGENT_INSTRUCTIONS[a] ?? ''),
    'Use tools to update the Digital Twin when you create projects, tasks, skills, or preferences.',
    'Write the final user-facing answer as markdown. Start with a one-line agent chain, then the plan.',
  ].join('\n\n');

  const codingTurn = chain.includes('coding');
  const result = await generateViaGateway({
    system,
    model: codingTurn ? OPENAI_MODELS.coding : OPENAI_MODELS.flagship,
    tools: BUDDY_TOOLS,
    messages: [
      ...(opts.history ?? []).slice(-8),
      {
        role: 'user',
        content: opts.utterance,
      },
    ],
  });

  let twin = opts.twin;
  if (result.toolCalls?.length) {
    for (const call of result.toolCalls) {
      twin = applyToolToTwin(twin, call.name, call.arguments);
    }
  }

  let reply = result.content;

  // Structured Outputs pass — per-agent summaries for the demo UI
  let parsedSummaries: AgentStep[] | null = null;
  if (result.provider === 'openai') {
    try {
      const structured = await generateViaGateway({
        model: OPENAI_MODELS.fast,
        jsonSchema: {
          name: 'agent_summaries',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              summaries: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    agent: { type: 'string' },
                    summary: { type: 'string' },
                  },
                  required: ['agent', 'summary'],
                  additionalProperties: false,
                },
              },
            },
            required: ['summaries'],
            additionalProperties: false,
          },
        },
        messages: [
          {
            role: 'user',
            content: `Given this Buddy reply, produce one short summary per agent in chain [${chain.join(', ')}]:\n\n${reply.slice(0, 4000)}`,
          },
        ],
      });
      const json = JSON.parse(structured.content) as {
        summaries?: { agent: string; summary: string }[];
      };
      if (json.summaries?.length) {
        parsedSummaries = json.summaries.map((s) => ({
          agent: (s.agent as AgentRole) || 'orchestrator',
          summary: s.summary,
          model: s.agent === 'coding' ? OPENAI_MODELS.coding : OPENAI_MODELS.flagship,
        }));
      }
    } catch {
      // keep chain placeholders
    }
  }

  // Career-story demo: "I want to become an AI Engineer."
  if (BECOME_ENGINEER_INTENT.test(opts.utterance)) {
    twin = applyToolToTwin(twin, 'upsert_project', {
      name: 'Firebase Inventory App',
      description: "Today's goal on the AI Engineer roadmap",
      progress: 8,
      stack: ['TypeScript', 'Firebase', 'OpenAI'],
      outstandingTasks: ['Begin implementation', 'Define inventory schema', 'Wire Auth + Firestore'],
    });
    twin = applyToolToTwin(twin, 'set_tasks', {
      tasks: [
        { title: 'Generated learning roadmap', projectName: 'Firebase Inventory App' },
        { title: 'Saved roadmap to Career Twin', projectName: 'Firebase Inventory App' },
        { title: 'Begin implementation', projectName: 'Firebase Inventory App' },
      ],
    });
    twin = applyToolToTwin(twin, 'patch_career_insight', {
      strengths: ['Authentication', 'Systems thinking'],
      weaknesses: ['AI Agents depth'],
      interests: ['AI engineering', 'OpenAI', 'Firebase'],
      roadmapProgress: Math.max(twin.careerRoadmapProgress, 42),
    });
    // Mark first two demo tasks done for Scene 5 narrative after build — career turn saves roadmap
    twin = {
      ...twin,
      goals: [
        {
          id: twin.goals[0]?.id ?? crypto.randomUUID(),
          title: 'Become an AI Engineer',
          status: 'active' as const,
          priority: 1,
        },
      ],
      currentTasks: twin.currentTasks.map((t) =>
        /generated learning|saved roadmap/i.test(t.title) ? { ...t, done: true } : t,
      ),
      experience: [
        ...twin.experience.filter((e) => !/yesterday/i.test(e)),
        'Completed Authentication module yesterday',
      ],
      updatedAt: Date.now(),
    };
    if (result.provider === 'coach' || !result.content.includes('Week 1')) {
      reply = [
        '## Learning Plan',
        '',
        '| Week | Focus |',
        '|------|--------|',
        '| Week 1 | Firebase |',
        '| Week 2 | OpenAI APIs |',
        '| Week 3 | AI Agents |',
        '| Week 4 | Deployment |',
        '',
        "### Today's Goal",
        '**Build a Firebase Inventory App**',
        '',
        'You’re 42% through your AI Engineering roadmap. Yesterday you finished Authentication — next we turn today’s goal into a real build.',
        '',
        'Say **“Build today\'s project.”** when you’re ready.',
      ].join('\n');
    }
  }

  // Career-story demo: "Build today's project."
  if (BUILD_TODAY_INTENT.test(opts.utterance) || (BUILD_INTENT.test(opts.utterance) && !BECOME_ENGINEER_INTENT.test(opts.utterance))) {
    if (!result.toolCalls?.length || BUILD_TODAY_INTENT.test(opts.utterance)) {
      twin = applyToolToTwin(twin, 'upsert_project', {
        name: 'Firebase Inventory App',
        description: 'Hands-on project for Week 1 · Firebase on the AI Engineer path',
        progress: 43,
        stack: ['TypeScript', 'Firebase', 'OpenAI'],
        outstandingTasks: ['Begin implementation', 'Ship CRUD demo screen'],
      });
      twin = applyToolToTwin(twin, 'set_tasks', {
        tasks: [
          { title: 'Generated Project', projectName: 'Firebase Inventory App' },
          { title: 'Saved Roadmap', projectName: 'Firebase Inventory App' },
          { title: 'Begin Implementation', projectName: 'Firebase Inventory App' },
        ],
      });
      twin = {
        ...twin,
        currentTasks: twin.currentTasks.map((t) =>
          /generated project|saved roadmap/i.test(t.title) ? { ...t, done: true } : t,
        ),
        goals: [
          {
            id: crypto.randomUUID(),
            title: 'Firebase Inventory App',
            status: 'active' as const,
            priority: 1,
          },
          ...twin.goals.filter((g) => !/inventory/i.test(g.title)).slice(0, 2),
        ],
        careerRoadmapProgress: Math.max(43, twin.careerRoadmapProgress),
        updatedAt: Date.now(),
      };
      twin = applyToolToTwin(twin, 'update_skill_progress', {
        skill: 'Firebase',
        progress: 48,
        delta: 0,
      });
      twin = applyToolToTwin(twin, 'patch_career_insight', {
        strengths: ['Firebase foundations'],
        weaknesses: ['AI Agents depth'],
        interests: ['AI Agents'],
        roadmapProgress: Math.max(43, twin.careerRoadmapProgress),
      });
    }
    if (BUILD_TODAY_INTENT.test(opts.utterance) && (result.provider === 'coach' || reply.length < 80)) {
      reply = [
        '## Today’s project: Firebase Inventory App',
        '',
        '**Architecture**',
        '- React + TypeScript client',
        '- Firebase Auth (reuse yesterday’s Authentication win)',
        '- Firestore inventory collection + security rules',
        '- Hosting for the demo screen',
        '',
        '**Milestones**',
        '1. Data model (item, qty, ownerUid)',
        '2. CRUD UI',
        '3. Rules + App Check checklist',
        '',
        '**Timeline:** one focused build session today.',
        '',
        'Career Twin updated — progress and tasks saved. Return to the Dashboard to see it.',
      ].join('\n');
    }
  }

  if (CONTINUE_INTENT.test(opts.utterance)) {
    const active = twin.projects.find((p) => p.status === 'active');
    if (active && !reply.toLowerCase().includes(active.name.toLowerCase())) {
      reply = [
        `Continuing **${active.name}** (${active.progress}%).`,
        active.outstandingTasks[0]
          ? `Next outstanding task: ${active.outstandingTasks[0]}.`
          : 'No outstanding tasks listed — let’s define the next milestone.',
        '',
        reply,
      ].join('\n');
    }
  }

  return {
    reply,
    steps: parsedSummaries?.length
      ? parsedSummaries
      : steps.map((s, i) => ({
          ...s,
          summary: `${AGENT_LABELS[s.agent]} · step ${i + 1}/${steps.length}`,
        })),
    twinPatch: twin,
    provider: result.provider,
    model: result.model,
  };
}
