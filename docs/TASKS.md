# Buddy AI 2.0 — TASKS

Competition-aware backlog. Status: `todo` | `doing` | `done` | `later`.

## P0 — Critical (judges must see OpenAI + agents)

| ID | Task | Status | Impact |
|----|------|--------|--------|
| T1 | Replace Gemini default with OpenAI Responses API (`gpt-5.6`) | done | AI usage ⭐⭐⭐⭐⭐ |
| T2 | Cloud Functions OpenAI proxy (server-side key) | done | Security / demo |
| T3 | Structured Outputs for agent plans + digital twin patches | done | OpenAI features |
| T4 | Function/tool calling loop (skills, memory, tasks, projects) | done | Agents |
| T5 | Agent Orchestrator: Career → PM → Coding → Research → Reviewer | done | Demo wow |
| T6 | Coding Agent uses Codex model (`gpt-5.2-codex`) | done | AI usage |
| T7 | Demo-first Dashboard (not chat-first) | done | UX / polish |
| T8 | Career Digital Twin profile (skills, goals, prefs, projects) | done | Differentiation |
| T9 | README rewrite: Career OS + architecture diagrams | done | README |

## P1 — High (demo depth)

| ID | Task | Status | Impact |
|----|------|--------|--------|
| T10 | Voice → Agent → Tool → Result (context-aware continue) | todo | Voice |
| T11 | Long-term memory beyond keywords (twin + conversation recall) | todo | Memory |
| T12 | Streaming Responses UI | todo | OpenAI features |
| T13 | Document / vision upload for diagrams | later | Document intel |
| T14 | Architecture diagrams in README + in-app | doing | Visual arch |

## P2 — Medium (after memorable demo works)

| ID | Task | Status | Impact |
|----|------|--------|--------|
| T15 | Cloud chat sync (conversations/messages) | later | Scalability |
| T16 | Tests for orchestrator + tools | later | Engineering |
| T17 | App Check + rate limits on proxy | later | Scalability |
| T18 | Remove / demote Gemini adapter from default path | todo | Focus |

## Explicitly postponed

- Wake word / OpenWakeWord
- Local Ollama runtime
- Full Firebase Storage media library
- Exhaustive CI matrix
- Finishing every v1 “later” stub

## Demo script (target 90s)

1. Open dashboard → “Good morning” + goal “Win OpenAI Build Week” + progress.
2. Voice: “Build me a Firebase inventory app.”
3. Orchestrator shows agent chain (Career → PM → Coding → Research → Reviewer).
4. Coding Agent (Codex) emits structured plan + starter files outline.
5. Twin updates: new project + tasks; skill bars move.
6. “Continue my AI project” — Buddy resumes without re-asking context.
