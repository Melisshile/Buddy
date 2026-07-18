# Buddy AI 2.0 — Build Week Charter

**Objective:** Maximize OpenAI Build Week judging score **without sacrificing trust**.

**Product:** Buddy is the **AI Career Operating System** — not a ChatGPT clone.

**Vision status: FROZEN.** Do not add features unless they fix a demo-breaking bug (`docs/DEMO_SCRIPT.md`).

**Quality over feature count.** From this point onward:

- Clean architecture, type-safe TypeScript, modular boundaries
- Proper error handling and secure API boundaries (no secrets in the client for production)
- Firebase security rules respected
- Observable demo (Developer Mode metrics)
- Clear documentation

Before marking anything complete: works end-to-end, no known critical bugs, safe to demo live, documented. If it cannot reach that bar in time, **postpone** it.

**Layers:** Layer 1 production core + Layer 2 demo polish only. Layer 3 (vision, wake word, full RAG, Document Agent, streaming) stays roadmap.

Maintain: `docs/FINAL_SUBMISSION_CHECKLIST.md`, `docs/JUDGE_QA.md`, `docs/DEMO_SCRIPT.md`, `CHANGELOG.md`.
