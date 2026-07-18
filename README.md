# Buddy AI 2.0

**The AI Career Operating System** — helps people learn, build, and grow over time.

> OpenAI Build Week · **GPT-5.6** · **Codex** · **Responses API** · Structured Outputs · tool calling  
> **Live:** https://buddy-46cbb.web.app

---

## Architecture at a glance

```text
User
      │
      ▼
Conversation Workspace
      │
      ▼
GPT-5.6
      │
      ▼
Career Intelligence
      │
      ▼
Tool Orchestrator
      │
 ┌────┼────┐
 │    │    │
 ▼    ▼    ▼
Career Memory
Growth Progress
Project Planner
      │
      ▼
Firebase
```

---

## Why Buddy?

- **Understands long-term career goals** — not just the last message  
- **Turns goals into structured learning plans** — week by week, with today’s project  
- **Tracks growth over time** — Career Memory and Growth Progress, not one-off answers  

> Buddy doesn’t just answer questions. It continuously helps people learn, build, and grow throughout their careers.

---

## The 90-second story

1. **Dashboard** — Welcome back · Authentication done yesterday · **42%** Growth Progress  
2. **“I want to become an AI Engineer.”** — Planning → Career Twin → Roadmap → Saving  
3. **Learning Plan** + today’s goal (Firebase Inventory App)  
4. **“Build today's project.”** — architecture, tasks, twin update  
5. **Dashboard** — updated goal, ~43%, next skill, tasks ✓/○  

Full script: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)

**Before every live demo:** Developer Menu → **Reset Demo**

---

## Why OpenAI?

OpenAI models provide the reasoning and structured outputs that let Buddy generate personalized roadmaps, coordinate workflows, and keep a consistent career profile over time — central to the product, not a swappable extra.

**Different from ChatGPT:** momentary answers vs continuous career progression.

More Q&A: [`docs/JUDGE_QA.md`](docs/JUDGE_QA.md)

---

## Quick start

```bash
npm install
npm run build:shared
cp .env.example apps/web/.env
npm run dev
```

Open http://localhost:5173 → enter demo → Dashboard.

### OpenAI (live Career Intelligence)

```env
VITE_USE_AI_MOCK=false
VITE_OPENAI_PROXY_URL=https://us-central1-buddy-46cbb.cloudfunctions.net/buddyOpenAI
# or local/dev only:
# VITE_OPENAI_API_KEY=sk-...
```

Functions need Firebase **Blaze**. Until then, local key or labeled coach fallback.

---

## Docs for judges

| Doc | Purpose |
|-----|---------|
| [`docs/OPERATOR_SHEET.md`](docs/OPERATOR_SHEET.md) | One-page live-demo cheat sheet |
| [`docs/VALIDATION_CHECKLIST.md`](docs/VALIDATION_CHECKLIST.md) | Prove critical paths (10× consecutive) |
| [`docs/FINAL_SUBMISSION_CHECKLIST.md`](docs/FINAL_SUBMISSION_CHECKLIST.md) | Go/no-go + freeze tag |
| [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) | Exact 90s narrative |
| [`docs/JUDGE_QA.md`](docs/JUDGE_QA.md) | What / why / how |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design |
| [`docs/BUILD_WEEK_AUDIT.md`](docs/BUILD_WEEK_AUDIT.md) | Claim vs code |
| [`docs/COMPETITION_READINESS.md`](docs/COMPETITION_READINESS.md) | What to show / hide |
| [`CHANGELOG.md`](CHANGELOG.md) | History |
| [`LICENSE`](LICENSE) | MIT |

**Codebase frozen for Build Week** after validation — only critical bugfixes (see submission checklist).

---

## Stack

| Layer | Tech |
|-------|------|
| App | React · Vite · TypeScript · Tailwind · PWA |
| AI | OpenAI Responses API · GPT-5.6 · Codex |
| Career Memory | IndexedDB · Firestore (partial) |
| Backend | Firebase Auth · Hosting · Functions |

```bash
npm run build
firebase deploy --only hosting --project buddy-46cbb
```
