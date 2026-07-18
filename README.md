# Buddy AI 2.0

**The AI Career Operating System** that helps students and professionals learn, build projects, and grow through intelligent voice interaction, persistent memory, and specialized AI agents.

> OpenAI Build Week entry · Powered by **GPT-5.6**, **Codex**, **Responses API**, Structured Outputs, and tool calling.

---

## Demo story (90 seconds)

1. **Dashboard** — “Good morning” + goal *Win OpenAI Build Week* + project progress + Career Digital Twin.
2. Say / click: **“Build me a Firebase inventory app.”**
3. Watch the **agent chain**: Career → Project Manager → Coding (Codex) → Research → Reviewer.
4. Twin updates — new project, tasks, skill progress.
5. Say: **“Continue my AI project.”** — Buddy resumes without re-asking context.

Hosted: https://buddy-46cbb.web.app

---

## Architecture

```
Voice / Text
    ↓
OpenAI (Responses API · GPT-5.6 / Codex)
    ↓
Agent Orchestrator
    ↓
Career · PM · Coding · Research · Learning · Document · Reviewer
    ↓
Shared Memory (Career Digital Twin + IndexedDB)
    ↓
Tools (skills, projects, tasks, preferences)
    ↓
Firebase (Auth · Firestore · Functions proxy · Hosting)
    ↓
UI (Dashboard + Voice Session)
```

```
Specialized Agents
        ↓
  Shared Memory
        ↓
     OpenAI
        ↓
    Firebase
```

---

## OpenAI capabilities (Build Week)

| Capability | How Buddy uses it |
|------------|-------------------|
| **GPT-5.6** | Default orchestration & career reasoning |
| **Codex (`gpt-5.2-codex`)** | Coding Agent implementation plans |
| **Responses API** | Primary generation path (`/v1/responses`) |
| **Structured Outputs** | Per-agent summary JSON for the demo UI |
| **Function / tool calling** | Update Digital Twin (skills, projects, tasks, prefs) |
| **Streaming** | Roadmapped (next demo polish) |
| **Vision** | Roadmapped for diagram uploads |

Gemini is **not** the default. Offline/demo falls back to a local coach only when OpenAI is unavailable.

---

## Features

- **Demo-first Dashboard** — purpose visible before any chat
- **Multi-agent orchestration** — coordinate, don’t just answer
- **Career Digital Twin** — skills, projects, goals, strengths, gaps
- **Voice → Agent → Tool → Result**
- **Local-first memory** (IndexedDB) + Firebase sync for profile/goals/skills/memories
- **PWA** installable shell

---

## Quick start

```bash
npm install
npm run build:shared
cp .env.example apps/web/.env
```

### Configure OpenAI (required for live demo)

**Option A — Functions proxy (recommended)**

```bash
# In Google Cloud / Firebase, set OPENAI_API_KEY for functions
npm --prefix functions install
npm run build:functions
firebase deploy --only functions --project buddy-46cbb
```

Set in `apps/web/.env`:

```env
VITE_OPENAI_PROXY_URL=https://us-central1-buddy-46cbb.cloudfunctions.net/buddyOpenAI
VITE_USE_AI_MOCK=false
```

**Option B — Local key (dev only, never commit)**

```env
VITE_OPENAI_API_KEY=sk-...
VITE_USE_AI_MOCK=false
```

```bash
npm run dev
```

Open http://localhost:5173 → enter demo / sign in → **Dashboard**.

---

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 18 · Vite 6 · TypeScript · Tailwind · PWA |
| AI | OpenAI Responses API · GPT-5.6 · Codex |
| Agents | In-app orchestrator + strict tool schemas |
| Data | IndexedDB (idb) · Firestore |
| Backend | Firebase Auth · Functions (`buddyOpenAI`) · Hosting |
| Monorepo | `apps/web` · `packages/shared` · `functions` |

---

## Monorepo

```
apps/web          React PWA (Dashboard, Voice, Agents, Twin)
packages/shared   Types · AI interfaces · voice · memory
functions         buddyOpenAI proxy · health · Auth seed
docs/             CHARTER · TASKS · DevelopmentReport
```

---

## Vision

Buddy is not a chat window. It is a **Career Operating System**:

- Agents that **coordinate** work
- A **Digital Twin** that remembers who you are becoming
- Voice that **continues projects**, not just transcripts text
- OpenAI as the intelligence layer judges expect to see

See `docs/CHARTER.md` and `docs/TASKS.md` for Build Week priorities.

---

## Deploy

```bash
npm run build
firebase deploy --only hosting,functions --project buddy-46cbb
```

Set `OPENAI_API_KEY` on Cloud Functions before demo day.
