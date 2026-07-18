# Buddy AI 2.0 — Judge Q&A

**Purpose:** One shared story for live demos, interviews, and follow-ups.  
**Product line:** Buddy is the **AI Career Operating System** — not a ChatGPT clone.  
**Demo script:** `docs/DEMO_SCRIPT.md`  
**Honesty rule:** Do not claim Stub/Partial features as complete (`docs/BUILD_WEEK_AUDIT.md`).

**Closing line (use often):**  
*Buddy doesn’t just answer questions. It continuously helps people learn, build, and grow throughout their careers.*

---

## How to use these answers

- Speak for **30–60 seconds** unless the judge asks for depth.
- Prefer the career narrative over tech laundry lists.
- If unsure: “That’s on our next milestone — here’s what ships in the demo today.”

---

## Product & positioning (Q1–Q8)

### 1. What is Buddy in one sentence?
Buddy is an AI Career Operating System that helps students and professionals learn, build projects, and grow — with a persistent Career Twin, structured plans, and coordinated AI workflows powered by OpenAI.

### 2. Who is it for?
Students and early-career builders who want to become AI Engineers (or similar paths) but don’t know what to learn next, how to turn goals into projects, or how to track growth over time.

### 3. What problem does it solve?
Generic chat answers questions in the moment and forgets context. Learners need continuity: goals, roadmap, today’s project, and visible growth. Buddy keeps that career state and acts on it.

### 4. Why is this different from ChatGPT?
ChatGPT helps you answer questions in the moment. Buddy continuously learns about your goals, tracks your growth progress, updates your career roadmap, and coordinates specialized workflows to help you move toward long-term outcomes.

### 5. Why call it an “operating system” instead of an assistant?
Because the core object isn’t a chat thread — it’s a durable Career Twin (skills, projects, goals, tasks) plus a Conversation Workspace and dashboard that reflect progress after AI actions.

### 6. What’s the demo story in 20 seconds?
A student wants to become an AI Engineer. Buddy welcomes them back, shows 42% roadmap progress, builds a four-week learning plan, sets today’s project, then turns “Build today’s project” into architecture and tasks that update the twin and dashboard.

### 7. What should we *not* say Buddy does today?
Don’t claim Document Agent, vision uploads, streaming UI, wake word, embedding RAG, or full multi-device chat sync as live — those are next-milestone (see audit).

### 8. What’s the one sentence you want judges to remember?
Buddy doesn’t just answer questions — it helps people learn, build, and grow throughout their careers.

---

## OpenAI & AI (Q9–Q14)

### 9. Why OpenAI?
OpenAI models provide the reasoning and structured outputs that allow Buddy to generate personalized roadmaps, coordinate specialized workflows, and maintain a consistent career profile over time. They are central to the product experience rather than an interchangeable backend.

### 10. Which OpenAI capabilities do you use?
Responses API as the primary path; GPT-5.6 for orchestration/reasoning; Codex (`gpt-5.2-codex`) when coding is in the workflow; tool/function calling to update the Career Twin; Structured Outputs for agent summary JSON when live OpenAI is configured.

### 11. Is Gemini still in the product?
No as the default. The Gemini adapter is deprecated and throws if called. Offline/demo may use a local coach fallback when OpenAI isn’t configured — we label that honestly in the UI.

### 12. Do you have “real” multi-agent systems?
We have an **orchestrator** that selects a role chain (Career, Project Manager, Coding, Reviewer, etc.) and runs OpenAI with those instructions, tools, and twin context. It is not yet N fully independent agent processes with sequential handoffs — we don’t overclaim that.

### 13. How does tool calling work?
The model can emit function calls (update skills, upsert projects, set tasks, remember preferences, patch career insights). The client applies them to the Career Twin in IndexedDB. For the demo script we also ensure twin updates so the dashboard change is reliable.

### 14. What happens if the OpenAI API fails mid-demo?
Buddy falls back to the local coach with a clear note. The dashboard and Career Twin still work. We never fake an “OpenAI” badge when the coach is active.

---

## Product experience (Q15–Q20)

### 15. What is the Career Twin / Career Memory?
A persistent profile of the learner: skills, projects, goals, tasks, strengths, gaps, preferences. That’s Career Memory — more than a chat log. The dashboard reads it as the home screen of the Career OS.

### 16. What is Growth Progress?
Visible movement on the roadmap and skills — e.g. 42% → 43%, completed Authentication yesterday, next skill AI Agents — not a vanity chat counter.

### 17. What is the Conversation Workspace?
The session where the user talks or types with Buddy: status beats (Planning…, Updating Career Twin…), agent labels, and the structured plan. It’s workspace for career actions, not endless free chat.

### 18. Why voice?
Voice lowers friction for busy learners. The competition demo prefers **typed** prompts for reliability; voice STT/TTS is available in Chrome/Edge as an enhancement.

### 19. Is data private / local-first?
Yes for the twin and messages: IndexedDB-first. Profile/goals/skills/memories can sync to Firestore when Firebase is configured. Conversation cloud sync and twin cloud sync are not complete yet — we say that if asked.

### 20. Can it work offline?
The shell and coach path can. Live OpenAI requires network. PWA caching helps the app shell load; we don’t claim full offline LLM.

---

## Business & competition (Q21–Q23)

### 21. What’s the business potential?
B2C subscription for learners; later B2B for bootcamps/universities (shared roadmaps, cohort twins). Moat is compounding Career Memory + workflow, not a single model call.

### 22. Why Build Week / why this entry?
We showcase OpenAI as the reasoning core of a career product: structured plans, tools that mutate state, and a narrative judges can feel in 90 seconds.

### 23. What would you build in the next two weeks?
(1) Harden OpenAI proxy on Blaze + App Check, (2) real tool round-trip loop, (3) twin as single source of truth everywhere, (4) optional streaming for polish — **not** vision/Document Agent until the demo is airtight.

---

## Honest limitations (Q24–Q25)

### 24. What are you most honest about that’s unfinished?
True sequential multi-agent handoffs, Document Agent, embedding-based Career Memory, chat/twin cloud sync, and Cloud Functions deploy (needs Blaze). The demo is designed around what works.

### 25. If you only ship one thing after Build Week, what is it?
Make Career Twin the single source of truth across dashboard and session, with OpenAI tools always writing it — so every return visit feels like a continuing career, not a new chat.

---

## Technical deep dive A — Architecture (2–3 minutes)

**Ask:** “Walk me through the architecture.”

**Answer structure:**

1. **UI:** Dashboard (Career Intelligence home) + Conversation Workspace.  
2. **Gateway:** All model calls go through an AI Gateway (`generateViaGateway`) — UI never talks to providers directly.  
3. **OpenAI:** Responses API (`/v1/responses`); preferred path is Cloud Function `buddyOpenAI` (server-side key); local key only for dev.  
4. **Orchestrator:** Classifies intent → picks agent role chain → builds twin context → calls OpenAI with tools → applies twin patches → optional Structured Outputs for summaries.  
5. **Career Memory:** IndexedDB (`buddy-v2`) stores twin, messages, memories; Firestore sync for a subset of entities when configured.  
6. **Firebase:** Auth, Hosting (live), Firestore rules; Functions when on Blaze.

```
Voice/Text → Conversation Workspace
    → Orchestrator + Career Twin context
    → OpenAI Responses (GPT-5.6 / Codex)
    → Tools update Career Twin
    → Dashboard shows Growth Progress
```

**Point to:** `docs/ARCHITECTURE.md`, `apps/web/src/agents/orchestrator.ts`, `apps/web/src/ai/gateway.ts`.

---

## Technical deep dive B — Security & keys (1–2 minutes)

**Ask:** “How do you handle API keys and user data?”

- OpenAI keys should live in Cloud Functions env, not the browser. `VITE_OPENAI_API_KEY` is **dev-only**.  
- Firebase Auth for signed-in users; demo mode for local evaluation.  
- Firestore rules are owner-scoped.  
- App Check is optional today — enabling it is a near-term hardening step.  
- We do not claim SOC2; we claim sensible defaults for a Build Week prototype.

---

## Rapid-fire one-liners

| Question | One-liner |
|----------|-----------|
| Tagline? | AI Career Operating System. |
| Demo open? | “I want to become an AI Engineer.” |
| Demo close? | Learn, build, and grow — not just answers. |
| vs ChatGPT? | Momentary answers vs continuous career progression. |
| Why OpenAI? | Reasoning + structured outputs + tools at the center of the product. |
| Risk? | Overclaiming unfinished agents — we don’t. |

---

## Shared vocabulary (use these words)

| Prefer | Avoid |
|--------|--------|
| Career Intelligence | AI Coach / generic coach branding in pitch |
| Career Memory | “Just memory” / chat history only |
| Growth Progress | Vague “progress” without career framing |
| Conversation Workspace | AI Chat / chatbot |
| Career Twin | User blob / profile dump |
| Orchestrator | “We have five separate AIs” (unless asked for depth) |

---

*Keep this file updated if the audit status of a feature changes. Never contradict `docs/BUILD_WEEK_AUDIT.md`.*
