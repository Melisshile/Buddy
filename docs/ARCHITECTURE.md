# Buddy AI 2.0 — Architecture

**Product:** AI Career Operating System  
**Vision status:** **Frozen for Build Week** — changes only if they fix the demo (`docs/DEMO_SCRIPT.md`).

---

## System context

```text
┌─────────────────────────────────────────────────────────────┐
│                     Buddy Web (PWA)                         │
│  Dashboard (Career Intelligence)  │  Conversation Workspace │
└───────────────┬────────────────────┴────────────┬───────────┘
                │                                 │
                ▼                                 ▼
        Career Twin (IDB)                 AI Gateway
        Career Memory                     generateViaGateway()
                │                                 │
                │                    ┌────────────┴────────────┐
                │                    ▼                         ▼
                │              OpenAI Adapter            Mock Coach
                │              Responses API             (offline/fallback)
                │                    │
                │         ┌──────────┴──────────┐
                │         ▼                     ▼
                │   GPT-5.6              gpt-5.2-codex
                │   (orchestrate)        (coding turns)
                │         │
                │         ▼
                │   Tools → applyToolToTwin()
                └─────────┴──► Dashboard Growth Progress
```

---

## Agent workflow (demo)

```text
User: "I want to become an AI Engineer."
        │
        ▼
┌───────────────┐
│  Orchestrator │  pickChain() → Career · Learning · PM · Reviewer
└───────┬───────┘
        │ status beats: Planning → Twin → Roadmap → Saving
        ▼
┌───────────────┐
│ OpenAI        │  Responses API + twin context + tools
└───────┬───────┘
        ▼
 Learning Plan + Today's Goal
        │
User: "Build today's project."
        │
        ▼
 Orchestrator → Career · PM · Coding (Codex) · Reviewer
        │
        ▼
 Architecture + tasks + twin mutation
        │
        ▼
 Dashboard: Growth Progress, goal, next skill, tasks ✓/○
```

**Note (honest):** Roles are coordinated in an orchestrator with shared twin context. This is not yet N independent agent runtimes with sequential handoffs. See `docs/BUILD_WEEK_AUDIT.md`.

---

## Monorepo layout

| Path | Responsibility |
|------|----------------|
| `apps/web` | React PWA — Dashboard, Conversation Workspace, voice, sync |
| `packages/shared` | Types, AI gateway interfaces, voice/memory helpers, prompts |
| `functions` | `buddyOpenAI` proxy, health, Auth profile seed |
| `docs/` | Charter, audit, readiness, demo script, judge Q&A, this file |

---

## Key modules

| Concern | Entry points |
|---------|----------------|
| Boot / routing | `apps/web/src/App.tsx` |
| Career Intelligence UI | `apps/web/src/features/Dashboard.tsx` |
| Conversation Workspace | `apps/web/src/features/VoiceSession.tsx` |
| Orchestrator | `apps/web/src/agents/orchestrator.ts` |
| Tools | `apps/web/src/agents/tools.ts` |
| AI Gateway | `apps/web/src/ai/gateway.ts`, `openaiClient.ts` |
| Career Twin | `apps/web/src/sync/twinDb.ts`, `localDb.ts` |
| Auth | `apps/web/src/auth/AuthProvider.tsx` |
| OpenAI proxy | `functions/src/index.ts` → `buddyOpenAI` |

---

## Data

**Local (source of truth for demo):** IndexedDB database `buddy-v2` — profile, twin, goals, skills, memories, conversations, messages.

**Cloud (partial):** Firestore users / goals / skills / memories when Firebase is configured. Conversations, messages, and twin are **not** fully synced yet.

---

## Security notes

- Prefer server-side `OPENAI_API_KEY` via Functions; avoid shipping keys in Vite for production.
- Firestore rules are owner-scoped (`firestore.rules`).
- App Check optional; enable before heavy public traffic.
- Functions deploy requires Firebase **Blaze** plan.

---

## Related docs

- `docs/DEMO_SCRIPT.md` — 90s narrative  
- `docs/JUDGE_QA.md` — live Q&A  
- `docs/BUILD_WEEK_AUDIT.md` — claim vs code  
- `docs/COMPETITION_READINESS.md` — what to show / hide  
- `README.md` — quick start & stack  
