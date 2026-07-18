# Buddy AI 2.0 — Build Week Feature Audit

**Audit date:** 18 July 2026  
**Method:** Static code tracing only. No feature is marked Implemented unless corresponding source exists and is reachable from a call path. Runtime deployment (live OpenAI key, hosted Functions URL, production Firebase console) was **not** verified.  
**Claims sources:** `README.md`, `CHANGELOG.md`, `docs/TASKS.md`, `docs/CHARTER.md`, `docs/DevelopmentReport.md` (Build Week header).

**Status legend**

| Status | Meaning |
|--------|---------|
| **Implemented** | Code path exists, is wired into UI or exported Functions, and performs the claimed behavior (possibly with documented limits). |
| **Partial** | Some of the claim exists; material gaps vs the wording of the claim. |
| **Stub** | Types, instructions, or throw/empty implementations exist; not product behavior. |
| **Missing** | No implementation found in the repository. |

**Screenshots:** The repository contains **no** PNG/JPG/GIF/WebP/MP4 demo assets. UI features list “Screenshots: none in repo” and name the React component to open instead.

---

## Summary table

| # | Claimed feature | Status |
|---|-----------------|--------|
| 1 | OpenAI Responses API as default AI path | **Partial** |
| 2 | GPT-5.6 model routing | **Partial** |
| 3 | Codex (`gpt-5.2-codex`) for Coding Agent | **Partial** |
| 4 | Cloud Functions `buddyOpenAI` proxy | **Implemented** (code) |
| 5 | Structured Outputs | **Partial** |
| 6 | Function / tool calling | **Partial** |
| 7 | Streaming responses UI | **Missing** |
| 8 | Vision / diagram upload | **Missing** |
| 9 | Multi-agent orchestrator (Career→…→Reviewer) | **Partial** |
| 10 | Document Agent | **Stub** |
| 11 | Learning Agent | **Partial** |
| 12 | Career Digital Twin | **Partial** |
| 13 | Demo-first Dashboard | **Implemented** |
| 14 | Voice → Agent → Tool → Result | **Partial** |
| 15 | Voice STT / TTS | **Partial** |
| 16 | Wake word | **Stub** |
| 17 | Local-first IndexedDB memory | **Implemented** |
| 18 | Keyword memory relevance | **Implemented** |
| 19 | Embedding / RAG memory | **Missing** |
| 20 | Firebase Auth (Google / anonymous / demo) | **Implemented** |
| 21 | Firestore sync (profile, goals, skills, memories) | **Partial** |
| 22 | Conversation / message cloud sync | **Missing** |
| 23 | Digital Twin cloud sync | **Missing** |
| 24 | PWA | **Implemented** |
| 25 | Mock coach fallback | **Implemented** |
| 26 | Gemini live adapter | **Stub** (deprecated throw) |
| 27 | Local AI runtime (Ollama etc.) | **Stub** |
| 28 | Firebase Storage uploads | **Stub** |
| 29 | Lessons entity | **Stub** |
| 30 | Automated tests / CI | **Missing** |
| 31 | Architecture diagrams (README ASCII) | **Partial** |
| 32 | In-app architecture diagrams | **Missing** |
| 33 | Hosted demo https://buddy-46cbb.web.app | **Unverified** (claim only) |

---

## 1. OpenAI Responses API as default AI path

**Status:** Partial

**Evidence**

- Client posts to `https://api.openai.com/v1/responses` in `apps/web/src/ai/openaiClient.ts` (`callOpenAIResponses`).
- Gateway selects OpenAI when configured: `apps/web/src/ai/gateway.ts` → `getAIGateway()` uses `createOpenAIAdapter()` unless `VITE_USE_AI_MOCK === 'true'` or `!isOpenAIConfigured()`.
- Env template: `.env.example` (`VITE_OPENAI_PROXY_URL`, `VITE_OPENAI_API_KEY`, `VITE_USE_AI_MOCK`).

**Functions / classes**

- `callOpenAIResponses`, `createOpenAIAdapter`, `getAIGateway`, `generateViaGateway`, `isOpenAIConfigured`

**How to test**

1. Set `VITE_OPENAI_API_KEY` or `VITE_OPENAI_PROXY_URL` in `apps/web/.env`, `VITE_USE_AI_MOCK=false`.
2. `npm run build:shared && npm run dev`.
3. Enter demo → session → send a message.
4. Header should show `AI: OpenAI` when adapter name is `openai` (`VoiceSession.tsx`).
5. Network tab: request to `/v1/responses` or the proxy URL.

**Limitations**

- Without env configuration, default is **mock coach**, not OpenAI (`getAIGateway` forceMock path).
- No `openai` npm package; raw `fetch` only.
- This audit does not confirm a live key works against OpenAI’s API.

---

## 2. GPT-5.6 model routing

**Status:** Partial

**Evidence**

- `OPENAI_MODELS.flagship = 'gpt-5.6'` in `packages/shared/src/ai/index.ts`.
- `OPENAI_MODELS.fast = 'gpt-5.6-luna'` used for structured summary pass in `runAgentOrchestra`.
- Default model in `callOpenAIResponses`: `request.model ?? 'gpt-5.6'`.

**Functions / classes**

- `OPENAI_MODELS`, `runAgentOrchestra`, `callOpenAIResponses`

**How to test**

1. Configure OpenAI; trigger orchestration.
2. Inspect request JSON `model` field (`gpt-5.6` or `gpt-5.6-luna` for summary pass).

**Limitations**

- Model ID is a string constant; repo cannot prove OpenAI accepts it at runtime.
- When coding is in the chain, the **primary** call uses Codex instead of `gpt-5.6` (see §3).

---

## 3. Codex (`gpt-5.2-codex`) for Coding Agent

**Status:** Partial

**Evidence**

- `OPENAI_MODELS.coding = 'gpt-5.2-codex'` in `packages/shared/src/ai/index.ts`.
- `runAgentOrchestra`: if `chain.includes('coding')`, `generateViaGateway({ model: OPENAI_MODELS.coding, ... })` — **one** request for the whole orchestra uses Codex.

**Functions / classes**

- `pickChain`, `runAgentOrchestra`

**How to test**

1. Utterance matching build/continue intents (e.g. “Build me a Firebase inventory app.”).
2. Inspect primary OpenAI request `model === "gpt-5.2-codex"`.

**Limitations**

- There is **no separate Codex-only Coding Agent process**. Career/PM/Research instructions are inlined into the same Codex call when coding is selected.
- UI agent-chain labels are local metadata; they are not separate model invocations per agent.

---

## 4. Cloud Functions `buddyOpenAI` proxy

**Status:** Implemented (source code)

**Evidence**

- `functions/src/index.ts` exports `buddyOpenAI` HTTPS function.
- Forwards POST body to `https://api.openai.com/v1/responses` with `OPENAI_API_KEY` or `functions.config().openai.key`.
- Optional Firebase ID token verification when `Authorization: Bearer` present.
- Also exports `buddyHealth`, `ensureUserProfile`.

**Functions / classes**

- `buddyOpenAI`, `buddyHealth`, `ensureUserProfile`

**How to test**

1. `npm --prefix functions run build` (compiles `functions/lib`).
2. Deploy with `OPENAI_API_KEY` set; `POST` JSON body matching Responses API.
3. Or call `buddyHealth` and check JSON `openai` boolean.

**Limitations**

- Empty `secrets: []` was removed; key must be provided via env/config — **not** verified deployed.
- CORS allows `*`.
- Auth is optional if no Bearer token is sent (unauthenticated proxy if URL is public).

**Screenshots:** N/A (backend)

---

## 5. Structured Outputs

**Status:** Partial

**Evidence**

- `GenerateRequest.jsonSchema` in `packages/shared/src/ai/index.ts`.
- `callOpenAIResponses` maps it to `text.format` `{ type: 'json_schema', ... }`.
- `runAgentOrchestra` second pass (only if `result.provider === 'openai'`) requests schema `agent_summaries` with `summaries[]`.

**Functions / classes**

- `callOpenAIResponses`, `runAgentOrchestra`

**How to test**

1. Live OpenAI path; complete an orchestration.
2. Confirm a second request includes `text.format.type === "json_schema"`.
3. Agent chain UI updates from parsed summaries when JSON parses.

**Limitations**

- Structured Outputs are **not** used for twin patches (tools / heuristics instead).
- Second pass skipped on coach fallback.
- Parse failures silently keep placeholder step summaries.

---

## 6. Function / tool calling

**Status:** Partial

**Evidence**

- Tool defs: `BUDDY_TOOLS` in `apps/web/src/agents/tools.ts`  
  (`update_skill_progress`, `upsert_project`, `set_tasks`, `remember_preference`, `patch_career_insight`).
- Sent via `body.tools` in `callOpenAIResponses` (`mapTools`).
- Returned `function_call` items parsed in `extractToolCalls`.
- Applied locally: `applyToolToTwin` inside `runAgentOrchestra`.
- Heuristic twin updates when `BUILD_INTENT` and **no** `toolCalls` (offline/coach path).

**Functions / classes**

- `BUDDY_TOOLS`, `applyToolToTwin`, `extractToolCalls`, `runAgentOrchestra`

**How to test**

1. Live OpenAI: ask to build an app; inspect response `output` for `function_call`.
2. Return to Dashboard; check project/tasks/skills changed in twin.
3. Without OpenAI: build utterance still mutates twin via heuristics in `runAgentOrchestra`.

**Limitations**

- **No multi-turn tool loop**: tool results are not sent back to the model as `function_call_output`.
- Model may return text only; twin then relies on heuristics for build intents.
- Tools do not write Firestore.

---

## 7. Streaming responses UI

**Status:** Missing

**Evidence**

- `GenerateRequest.stream?: boolean` exists in `packages/shared/src/ai/index.ts`.
- Grep across repo: **no** use of `request.stream`, SSE, or streaming fetch for OpenAI.
- README lists Streaming as “Roadmapped”.

**How to test:** N/A — no UI streaming path.

**Limitations:** Entire replies appear after full completion.

---

## 8. Vision / diagram upload

**Status:** Missing

**Evidence**

- No file input / image upload components under `apps/web/src`.
- No vision content parts in `messagesToInput` (text-only `input_text` / `output_text`).
- README: Vision “Roadmapped”; `docs/TASKS.md` T13 `later`.

**How to test:** N/A

---

## 9. Multi-agent orchestrator (Career → PM → Coding → Research → Reviewer)

**Status:** Partial

**Evidence**

- `pickChain` + `runAgentOrchestra` in `apps/web/src/agents/orchestrator.ts`.
- Agent roles typed in `packages/shared/src/types/index.ts` (`AgentRole`).
- Labels: `AGENT_LABELS` in `packages/shared/src/index.ts`.
- UI: `VoiceSession` renders `agentChain` from `generateBuddyReply` → `orchestrated.steps`.
- Entry: `companion.ts` → `generateBuddyReply` → `runAgentOrchestra`.

**Build-intent chain (code):**  
`orchestrator → career → project_manager → coding → research → reviewer`

**Functions / classes**

- `pickChain`, `runAgentOrchestra`, `generateBuddyReply`, `VoiceSession`

**Screenshots:** none in repo — open Voice Session during/after a build prompt; look for “Agent chain” panel.

**How to test**

1. Dashboard → “Demo: Build inventory app” or type that phrase.
2. Observe agent chain list in `VoiceSession`.
3. With coach only, steps still appear (local placeholders / completed labels).

**Limitations**

- **Not** separate sequential agent API calls. One (or two) model calls with multi-agent **prompt instructions**.
- Chain UI can show placeholders (“standing by” / “completed step”) that do not equal real per-agent execution.
- Document Agent never appears in `pickChain` (see §10).

---

## 10. Document Agent

**Status:** Stub

**Evidence**

- Instruction string only: `AGENT_INSTRUCTIONS.document` in `orchestrator.ts`.
- `AgentRole` includes `'document'`.
- **`pickChain` never returns `'document'`** (verified by reading all branches).

**How to test:** No user utterance selects Document Agent.

**Limitations:** Marketing/CHANGELOG listing overstates presence.

---

## 11. Learning Agent

**Status:** Partial

**Evidence**

- Included when `LEARN_INTENT` or `CAREER_INTENT` matches in `pickChain`.
- Instruction: `AGENT_INSTRUCTIONS.learning`.
- Same single-call orchestration pattern as other agents.

**How to test:** “Teach me embeddings” or “career roadmap” style prompts; check chain includes `learning`.

**Limitations:** No dedicated learning curriculum engine; prompt role only.

---

## 12. Career Digital Twin

**Status:** Partial

**Evidence**

- Type: `DigitalTwin` and related types in `packages/shared/src/types/index.ts`.
- Persistence: IndexedDB store `twin` (DB version 2) via `apps/web/src/sync/twinDb.ts` + `localDb.ts` upgrade.
- Seed: `defaultDigitalTwin` (goals include “Win OpenAI Build Week”, project “Buddy AI 2.0” at 72%, etc.).
- Bootstrap: `ensureTwin` from `AuthProvider.bootstrap` and `Dashboard` / `generateBuddyReply`.
- Updates: orchestrator tools/heuristics → `putTwin`.

**Functions / classes**

- `defaultDigitalTwin`, `getTwin`, `putTwin`, `ensureTwin`, `applyToolToTwin`, `Dashboard`

**Screenshots:** none in repo — `Dashboard.tsx` shows twin fields after login/demo.

**How to test**

1. Enter demo → Dashboard shows greeting, goal, progress, skills, strengths/gaps.
2. Run build prompt → return via “Dashboard” → twin fields should reflect `putTwin` updates (component remounts on view switch).

**Limitations**

- Twin is **local-only** (no Firestore sync).
- `SidebarPanel` reads **seeded** `goals`/`skills` collections, **not** the Digital Twin — Progress sidebar can disagree with Dashboard twin.
- No automatic “You’re becoming strong in Firebase…” insight generator beyond static/heuristic fields.
- Education/certificates/experience fields exist on the type and seed; limited UI surface on Dashboard.

---

## 13. Demo-first Dashboard

**Status:** Implemented

**Evidence**

- Default view `'dashboard'` in `apps/web/src/App.tsx` `Boot`.
- Component: `apps/web/src/features/Dashboard.tsx`.
- Shows greeting, continue card, today tasks, project progress, current goal, career roadmap, twin summary, demo CTA buttons.
- Navigates to `VoiceSession` via `onOpenSession`.

**Functions / classes**

- `Boot`, `Dashboard`, `greetingName`

**Screenshots:** none in repo — load app after auth/demo; first screen is Dashboard, not chat.

**How to test**

1. `npm run dev` → Enter demo mode.
2. Confirm Dashboard before any chat.
3. Click “Demo: Build inventory app” → Voice Session with seed prompt.

**Limitations**

- No React Router; view state is React `useState` only.
- PWA manifest description still says “AI companion…” (older copy) in `vite.config.ts`.

---

## 14. Voice → Agent → Tool → Result

**Status:** Partial

**Evidence**

- Mic path: `VoiceSession` → `createVoiceEngine` → `handleUtterance` → `generateBuddyReply` → `runAgentOrchestra` → tools/heuristics → `putTwin` + assistant message.
- Continue heuristic: `CONTINUE_INTENT` prepends active project context in `runAgentOrchestra`.

**Functions / classes**

- `createVoiceEngine`, `handleUtterance`, `generateBuddyReply`, `runAgentOrchestra`

**How to test**

1. Chrome/Edge: tap Talk; say “Continue my AI project.”
2. Or type the same.
3. Confirm reply references active twin project when present.

**Limitations**

- Depends on Web Speech browser support.
- Tools only apply if the model emits tool calls or build heuristics run.
- Not OpenAI Realtime voice — browser STT/TTS only.

---

## 15. Voice STT / TTS

**Status:** Partial

**Evidence**

- `apps/web/src/voice/engine.ts`: `createWebSpeechRecognizer`, `createWebSpeechSynthesizer`, `createVoiceEngine`.
- Interfaces: `packages/shared/src/voice/index.ts`.
- TTS truncated to 600 chars; non-blocking in `VoiceSession`.

**How to test**

1. Chrome/Edge with mic permission.
2. Talk → interim transcript → final utterance.
3. Assistant reply triggers `speechSynthesis`.

**Limitations**

- Unsupported browsers show typed fallback message.
- `continuous = false` (single utterance).
- Wake word stubbed (§16).

---

## 16. Wake word

**Status:** Stub

**Evidence**

- `createStubWakeWord` in `packages/shared/src/voice/index.ts` (`isSupported: false`, empty start/stop).
- Wired in `createVoiceEngine`.

**How to test:** `engine.wakeWord.isSupported === false`.

---

## 17. Local-first IndexedDB memory (messages, goals, skills, memories)

**Status:** Implemented

**Evidence**

- `apps/web/src/sync/localDb.ts` — stores: `profile`, `twin`, `goals`, `skills`, `memories`, `conversations`, `messages`, `meta`.
- Writes on chat: `putMessage` in `generateBuddyReply`.
- Reads: `listMessages`, `loadConversationHistory`.

**Functions / classes**

- `getLocalDb`, `putMessage`, `listMessages`, `putMemory`, `listMemories`, …

**How to test**

1. Send messages; refresh page; history reloads from IndexedDB.
2. DevTools → Application → IndexedDB → `buddy-v1`.

**Limitations**

- Dual history: `ConversationManager` in-memory vs IndexedDB messages can diverge mid-session vs reload.
- Not synced to cloud for chat (§22).

---

## 18. Keyword memory relevance

**Status:** Implemented

**Evidence**

- `scoreMemoryRelevance` + `createInMemoryStore` in `packages/shared/src/memory/index.ts`.
- Used in `buildContextBlock` (`companion.ts`) over IndexedDB memories.
- “Remember …” → `extractAndStoreMemory` → `pushMemory`.

**How to test**

1. “Remember that I prefer TypeScript”.
2. Later ask a related question with OpenAI/coach context builders that call `buildContextBlock` (summarize_week coach path) or inspect stored memories.

**Limitations**

- Token overlap scoring only — not embeddings.
- `createInMemoryStore` is not the web app’s primary store (IndexedDB is).

---

## 19. Embedding / RAG memory

**Status:** Missing

**Evidence**

- No embeddings API calls, vector store, or RAG retrieval module in `apps/web` / `functions` / `packages/shared` beyond keyword scoring and curriculum skill names.

---

## 20. Firebase Auth (Google / anonymous / demo)

**Status:** Implemented

**Evidence**

- `apps/web/src/auth/AuthProvider.tsx`: Google popup, anonymous, demo UID `demo-local-user`.
- UI: `LoginScreen.tsx`.
- Firebase client: `apps/web/src/lib/firebase.ts`.

**Functions / classes**

- `AuthProvider`, `useAuth`, `useUserId`, `signInGoogle`, `signInDemo`, `getFirebaseAuth`

**Screenshots:** none in repo — `LoginScreen`.

**How to test**

1. Empty Firebase env → demo mode boots with twin.
2. Configured Firebase → Google / anonymous buttons.

**Limitations**

- Requires Firebase console Auth providers enabled for non-demo paths (runtime).

---

## 21. Firestore sync (profile, goals, skills, memories)

**Status:** Partial

**Evidence**

- `apps/web/src/sync/syncEngine.ts`: `syncFromCloud` / `pushAllLocal` for `users`, `goals`, `skills`, `memories` only.
- Rules exist in `firestore.rules` for those collections plus conversations/messages/lessons.

**Functions / classes**

- `fullSync`, `pushMemory`, `ensureLocalProfile`, `seedDefaults`

**How to test**

1. Configure Firebase; sign in; check Firestore console for written docs.
2. Offline: sync skipped (`navigator.onLine` guards).

**Limitations**

- Silent `catch` blocks.
- Conversations/messages/twin/lessons not pushed by client despite some rules existing.

---

## 22. Conversation / message cloud sync

**Status:** Missing

**Evidence**

- `syncEngine.ts` has **no** references to `conversations` or `messages` collections.
- Messages only via `localDb.putMessage` / `listMessages`.

---

## 23. Digital Twin cloud sync

**Status:** Missing

**Evidence**

- Twin only in IndexedDB (`twinDb.ts`). No Firestore `twin` write/read in `syncEngine.ts`.

---

## 24. PWA

**Status:** Implemented

**Evidence**

- `vite-plugin-pwa` in `apps/web/vite.config.ts`: manifest, `autoUpdate`, Workbox glob + NetworkFirst documents.
- Icon asset: `apps/web/public/buddy-icon.svg`.

**How to test**

1. `npm run build -w @buddy/web` → check `dist` for SW/manifest.
2. `npm run preview`; Chrome Application panel → Manifest / Service Workers.

**Limitations**

- Single SVG icon; no dedicated install UI; limited runtime caching.

---

## 25. Mock coach fallback

**Status:** Implemented

**Evidence**

- `createMockAdapter` / `buildCoachingReply` in `gateway.ts`.
- Used when mock forced, offline (`generateViaGateway`), or OpenAI errors (annotated fallback).

**How to test**

1. Unset OpenAI env or set `VITE_USE_AI_MOCK=true`.
2. Header shows `AI: coach`.
3. Build-style prompts still return agent-plan-style markdown from coach.

---

## 26. Gemini live adapter

**Status:** Stub

**Evidence**

- `createGeminiAdapter` in `gateway.ts` throws: *“Gemini is deprecated… Configure OpenAI.”*
- Not selected by `getAIGateway`.

**How to test:** Calling `createGeminiAdapter().generateResponse(...)` rejects.

---

## 27. Local AI runtime (Ollama etc.)

**Status:** Stub

**Evidence**

- `apps/web/src/ai/localRuntime.ts` — `createLocalAIRuntimeStub` (`isAvailable: false`, `generate` throws).
- Not imported by gateway/orchestrator (orphan stub module).

---

## 28. Firebase Storage uploads

**Status:** Stub

**Evidence**

- `getFirebaseStorage()` in `firebase.ts`.
- `storage.rules` present.
- No call sites that upload/download user files in `apps/web/src`.

---

## 29. Lessons entity

**Status:** Stub

**Evidence**

- `Lesson` interface in `packages/shared/src/types/index.ts`.
- Firestore rules `match /lessons/{lessonId}` in `firestore.rules`.
- No lesson CRUD UI or sync helpers in web app.

---

## 30. Automated tests / CI

**Status:** Missing

**Evidence**

- Glob `**/*.{test,spec}.{ts,tsx}`: **0 files**.
- No `.github/workflows` directory in repo layout used for this project.

---

## 31. Architecture diagrams (README)

**Status:** Partial

**Evidence**

- ASCII diagrams in `README.md` (Voice→OpenAI→Orchestrator→… and Agents→Memory→OpenAI→Firebase).
- No Mermaid/SVG diagram files in repo.

**How to test:** Open `README.md` on GitHub.

**Limitations:** Text diagrams only; T14 “in-app” not done (§32).

---

## 32. In-app architecture diagrams

**Status:** Missing

**Evidence**

- No Dashboard/Session component rendering architecture graphics.
- `docs/TASKS.md` T14 marked `doing` but no matching UI code found.

---

## 33. Hosted demo URL

**Status:** Unverified (documentation claim)

**Evidence**

- String in `README.md`: `https://buddy-46cbb.web.app`
- `.firebaserc` / deploy scripts reference project `buddy-46cbb`.
- This audit did **not** HTTP-check the live site or confirm it serves the 2.0 Build Week build.

**How to test:** Open the URL in a browser; compare UI to Dashboard + OpenAI labeling.

---

## Call-path map (what actually runs on a user message)

```
LoginScreen / demo
  → AuthProvider.bootstrap → ensureLocalProfile, seedDefaults, ensureTwin, fullSync
  → App Boot view=dashboard → Dashboard
  → onOpenSession → VoiceSession
       → (optional) Web Speech STT
       → generateBuddyReply
            → runAgentOrchestra
                 → pickChain (regex)
                 → generateViaGateway
                      → OpenAI adapter → callOpenAIResponses (/v1/responses)
                        OR mock coach
                 → applyToolToTwin (if toolCalls)
                 → heuristic twin patch (build intent, no tools)
                 → optional Structured Outputs summary pass (openai only)
            → putTwin
            → putMessage ×2 (IndexedDB)
       → TTS (optional)
```

---

## Claim vs code mismatches (high risk for judges)

1. **“Specialized agents”** read as independent agents; code is **prompt-simulated multi-agent in 1–2 API calls**.
2. **Document Agent** listed in CHANGELOG/README agent set but **never selected** by `pickChain`.
3. **OpenAI-powered** branding appears on Login/Dashboard even when `isOpenAIConfigured()` is false (coach fallback note exists on Dashboard only).
4. **Progress sidebar** ≠ Digital Twin data source.
5. **Streaming / Vision** claimed as roadmap elsewhere but easy to misread as shipped if skimming README tables — audit marks them Missing.
6. **TASKS.md** marks T1–T9 `done`; several are **Partial** by the definitions above.

---

## How to re-run this audit

1. Search claims in `README.md` / `CHANGELOG.md`.
2. Grep for symbols (`runAgentOrchestra`, `buddyOpenAI`, `DigitalTwin`, `stream`, `document`).
3. Confirm UI entry from `App.tsx`.
4. Do not mark Implemented without a reachable call path from UI or an exported Cloud Function.
