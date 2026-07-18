# Buddy AI 2.0 — Competition Readiness Report

**Source:** `docs/BUILD_WEEK_AUDIT.md` (static code audit, 18 July 2026)  
**Purpose:** Decide what is safe to show live, what to close in hours, and what to leave out of the pitch.  
**Rule:** Do not present Stub or unfinished Partial features as complete. Prefer a short, true demo over a long, brittle one.

## Vision freeze

**No new features** unless they directly fix `docs/DEMO_SCRIPT.md`.  
From here: demo reliability (20+ rehearsals), repo polish, language, judge Q&A (`docs/JUDGE_QA.md`), optional 90s video.

---

## Executive verdict

| Question | Answer |
|----------|--------|
| Ready to win as marketed today? | **No** — OpenAI, real multi-agent, and tool loop are still Partial. |
| Ready for a **narrow, honest** demo after small fixes? | **Yes** — if you close the Critical Partial gaps below (~6–10 focused hours) and script only Demo Ready steps. |
| Biggest demo risk | Claiming “agents coordinate” / “OpenAI-powered” while the live path is coach fallback or single prompt simulation. |

**Honesty line for judges (recommended):**

> Buddy includes Career Intelligence on the dashboard, a Conversation Workspace, and an orchestrator that updates Career Memory. We demo the path from “become an AI Engineer” to today’s project and Growth Progress. Document Agent and vision are next-milestone, not in this demo.

---

## 1. Demo Ready — safe to show live

These are Implemented (or Implemented-enough) with known, manageable limits. Script the demo around these only.

| Feature | Audit status | Why it’s safe | Caveats to accept |
|---------|--------------|---------------|-------------------|
| Demo-first Dashboard | Implemented | First screen after auth/demo; real twin fields | Remount required to refresh after session |
| Local IndexedDB persistence | Implemented | Messages/twin/goals survive refresh | Device-local only |
| Keyword “Remember…” memory | Implemented | Prefer TypeScript-style prefs store | Not embeddings/RAG |
| Auth / demo mode | Implemented | Always have a login path | Demo UID shared on one browser |
| Mock coach fallback | Implemented | Demo never fully dead without API key | Must **not** claim live GPT if coach is active |
| PWA shell | Implemented | Install/offline shell exists | Don’t center the pitch on PWA |
| README ASCII architecture | Partial → OK as slide | Clear storyboard for judges | Don’t claim interactive in-app diagram |
| Voice STT/TTS (Chrome/Edge) | Partial → OK as optional | Typed path is reliable backup | Prefer **typed** prompts on stage |
| `buddyOpenAI` function **code** | Implemented (code) | Exists in repo | Not Demo Ready until key deployed + URL set |
| Progress sidebar (seeded goals/skills) | Implemented UI | Can open if needed | **Do not** use as twin source of truth in narration |

### What you may say on stage (Demo Ready)

- “This is Buddy’s Career Operating System home — goals, project progress, twin skills.”
- “Your data is stored locally first in IndexedDB.”
- “You can talk or type; we’ll type for reliability.”
- “If OpenAI isn’t configured, you’ll see coach fallback — we won’t pretend otherwise.”

### What you must not say yet

- “Document Agent is live.”
- “True multi-agent handoffs with separate model runs.” (until Needs 1–2h / significant work closes)
- “Buddy syncs every chat to the cloud.”
- “Streaming / vision / wake word / RAG.”

---

## 2. Needs 1–2 hours — small gaps to close before demo

Highest leverage Partial → Implemented conversions. Do these **before** adding new features.

| # | Feature | Audit | Effort | Close criteria (Definition of Done) |
|---|---------|-------|--------|-------------------------------------|
| A | **OpenAI default in the live demo build** | Partial | 1–2 h | `VITE_USE_AI_MOCK=false`; proxy URL or key set; deploy `buddyOpenAI` with `OPENAI_API_KEY`; session header shows `AI: OpenAI`; one successful `/v1/responses` in Network tab; Dashboard does **not** show “Coach fallback”. |
| B | **Tool-calling loop (act, don’t only reply)** | Partial | 1.5–2 h | After model `function_call`, client sends `function_call_output` back and gets a final answer; twin updated via `applyToolToTwin`; **no dependency** on build-intent heuristics for the demo script. |
| C | **Digital Twin single source of truth** | Partial | 1–2 h | Dashboard + session + Progress sidebar all read/write `twin` (or sidebar removed from demo); after tool update, returning to Dashboard shows new project % / tasks without manual IDB surgery. |
| D | **Structured Outputs for the plan** | Partial | 1–1.5 h | One Responses call returns strict JSON plan (milestones + agentSummaries + tool intents) **or** tools + a strict final plan schema used consistently; UI renders plan from schema, not free-text hope. |
| E | **Honest agent labeling** | Partial | 0.5–1 h | UI only lists agents that actually ran in this turn; remove Document from README/demo copy; pitch says “Career, PM, Coding, Reviewer” (and Learning only if in chain). |
| F | **Demo script dry-run** | — | 0.5–1 h | Full 90s rehearsed twice with OpenAI live; typed prompt only; twin visibly changes. |

**Total Critical path:** ~6–10 hours (A–F), not 120 hours of backlog.

### Explicitly defer (even if “medium” in product roadmap)

| Feature | Why defer for competition |
|---------|---------------------------|
| Chat cloud sync | Judges won’t open two devices in 90s |
| Streaming UI | Polish; doesn’t prove the product |
| Twin Firestore sync | Local twin is enough if dashboard updates |
| Tests / CI | Won’t appear on stage |
| App Check rate limits | Important later; not the 90s story |

---

## 3. Needs significant work — do not include in the demo

Do not pitch these. Strip or soft-pedal in README/demo script until real.

| Feature | Audit | Why out of demo | If asked by judges |
|---------|-------|-----------------|-------------------|
| True multi-agent sequential orchestration | Partial | Today = one prompt simulating many agents; making “real” (N sequential calls + shared state) is a multi-hour redesign | “We run an orchestrator with specialized roles; full sequential handoffs are next.” |
| Separate Codex-only Coding Agent process | Partial | Codex currently wraps the whole build turn | “Coding turns route to `gpt-5.2-codex`.” (true) — don’t claim isolated agent process |
| Document Agent | Stub | Never in `pickChain` | “Planned next milestone.” |
| Learning Agent as product | Partial | Prompt role only | Mention only if that intent chain is shown |
| Embedding / RAG memory | Missing | No vector path | “Keyword + twin memory today.” |
| Vision / uploads | Missing | No UI | Out of scope for this demo |
| Streaming | Missing | No code path | Out of scope |
| Wake word | Stub | `isSupported: false` | Out of scope |
| Local Ollama runtime | Stub | Throws | Out of scope |
| Gemini | Stub | Deprecated throw | Don’t mention |
| Firebase Storage media | Stub | Getter unused | Out of scope |
| Lessons entity | Stub | Type + rules only | Out of scope |
| Conversation cloud sync | Missing | Not in `syncEngine` | Out of scope |
| Twin cloud sync | Missing | Local only | “Local-first twin for the demo.” |
| In-app architecture diagrams | Missing | ASCII in README only | Show README slide if needed |
| Hosted URL fidelity | Unverified | May serve older build | Verify deploy **before** linking judges |

---

## 4. Shortest path to a flawless 90-second demo

**Canonical script:** `docs/DEMO_SCRIPT.md` (career progression story — not “build me an app”).

**Principle:** One unforgettable workflow. Reliability over feature count. Typed input. Twin must move.

### The story judges should feel

> Career progression powered by AI — not a coding chatbot.

| Scene | Time | Beat |
|-------|------|------|
| 1 | 0:00–0:15 | Dashboard: Welcome back · Authentication done yesterday · **42%** roadmap |
| 2 | 0:15–0:30 | `I want to become an AI Engineer.` → Planning / Twin / Roadmap / Saving |
| 3 | 0:30–0:55 | Learning Plan (4 weeks) + Today’s Goal: Firebase Inventory App |
| 4 | 0:55–1:15 | `Build today's project.` → architecture + twin update |
| 5 | 1:15–1:30 | Dashboard: goal, ~43%, next skill, tasks with ✓ / ○ |

**Winning close:** *Buddy doesn’t just answer questions. It continuously helps people learn, build, and grow throughout their careers.*

**Do not open with:** `Build me a Firebase inventory app.`

### Pre-flight checklist (T−1 day)

1. [ ] OpenAI live — header `AI: OpenAI`, Dashboard without Coach fallback.
2. [ ] Fresh `buddy-v2` IndexedDB (or clear site data) so twin seed matches Scene 1.
3. [ ] Typed prompts only; rehearse Scenes 1→5 twice.
4. [ ] Hosting matches this commit if using the public URL.

### Closing engineering gaps (still worth hours before stage)

```
A. Wire OpenAI for the demo build
B. Tool round-trip (optional if heuristic twin path is stable for script)
C. Twin SoT already improved on Dashboard — verify after Scene 4→5
D. Structured Outputs polish (nice-to-have if coach/OpenAI plan text is solid)
E. Honest copy (Document Agent never pitched) — done in DEMO_SCRIPT
F. Rehearse
```

Stop after a green A + F. Extra features lose to polish.
---

## 5. Feature triage matrix (audit → readiness)

| # | Feature | Audit | Readiness bucket |
|---|---------|-------|------------------|
| 13 | Demo-first Dashboard | Implemented | **Demo Ready** |
| 17 | Local-first IndexedDB | Implemented | **Demo Ready** |
| 18 | Keyword memory | Implemented | **Demo Ready** |
| 20 | Auth / demo | Implemented | **Demo Ready** |
| 24 | PWA | Implemented | **Demo Ready** (background) |
| 25 | Mock coach | Implemented | **Demo Ready** (backup only) |
| 4 | `buddyOpenAI` code | Implemented (code) | **Needs 1–2 h** to be live |
| 1 | OpenAI default | Partial | **Needs 1–2 h** |
| 5 | Structured Outputs | Partial | **Needs 1–2 h** |
| 6 | Tool-calling loop | Partial | **Needs 1–2 h** |
| 12 | Digital Twin integration | Partial | **Needs 1–2 h** |
| 14 | Voice → Agent → Tool | Partial | Typed path Demo Ready; voice optional |
| 15 | Voice STT/TTS | Partial | Optional; don’t depend on it |
| 2–3 | GPT-5.6 / Codex routing | Partial | OK to mention model IDs after OpenAI live |
| 9 | Multi-agent orchestration | Partial | Pitch as orchestrator roles until sequential work ships → else **Significant** |
| 11 | Learning Agent | Partial | Out of primary script |
| 21 | Firestore sync subset | Partial | Out of 90s script |
| 31 | README diagrams | Partial | Slide OK |
| 10 | Document Agent | Stub | **Significant / exclude** |
| 16 | Wake word | Stub | **Exclude** |
| 26–29 | Gemini / local AI / Storage / Lessons | Stub | **Exclude** |
| 7–8 | Streaming / Vision | Missing | **Exclude** |
| 19 | RAG | Missing | **Exclude** |
| 22–23 | Chat/twin cloud sync | Missing | **Exclude** |
| 30 | Tests / CI | Missing | **Exclude** |
| 32 | In-app diagrams | Missing | **Exclude** |
| 33 | Hosted URL | Unverified | Verify or don’t link |

---

## 6. Success criteria for “competition ready”

All must be true:

1. Live turn shows **OpenAI** in the UI (not coach) for the recorded/judged demo.
2. One typed build prompt produces a **structured plan** visible in the UI.
3. At least one **tool-backed** twin mutation (project or tasks or skill) without relying on silent heuristics as the only path.
4. Dashboard **reflects** that mutation when you navigate back.
5. Spoken pitch never names Document Agent, vision, streaming, wake word, or cloud chat sync.
6. 90s script rehearsed twice without failure.

When 1–6 are green: **ship the demo**. Everything else is post-submission roadmap.

---

## 7. Suggested next Cursor task (implementation)

> Close readiness items A–E only: (1) ensure OpenAI is default for the demo env via Functions proxy, (2) implement a real tool-call round-trip in the orchestrator, (3) make Dashboard/Progress use Digital Twin as the single source of truth and refresh after session, (4) use Structured Outputs for the demo plan payload, (5) remove Document Agent from user-facing copy. Do not implement streaming, vision, or chat sync. Update `BUILD_WEEK_AUDIT.md` statuses after each item and re-check this readiness file.

---

*This report prioritizes a flawless 90-second demonstration over feature completeness. Reliability beats ambition on stage.*
