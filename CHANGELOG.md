# Changelog

All notable changes to Buddy AI 2.0 for OpenAI Build Week.

## [2.0.0-buildweek] — 2026-07-18

### Added
- Build Week charter (`docs/CHARTER.md`) and competition task board (`docs/TASKS.md`).
- OpenAI Responses API integration (`gpt-5.6`) as the primary AI path.
- Cloud Functions `buddyOpenAI` proxy for server-side API keys.
- Agent Orchestrator with specialized agents (Career, Project Manager, Coding, Research, Learning, Document, Reviewer).
- Tool calling + Structured Outputs for plans and digital-twin patches.
- Career Digital Twin types and local persistence.
- Demo-first Dashboard (Career Operating System home).
- Codex model routing for Coding Agent (`gpt-5.2-codex`).

### Changed
- Product positioning: AI Career Operating System (not chat clone).
- README rewritten for judges (vision, architecture, OpenAI stack, quick start).
- Development report roadmap realigned to Build Week priorities.
- AI Gateway defaults to OpenAI; mock coach remains offline/fallback only.

### Deprecated
- Gemini-as-default path (adapter retained only as optional legacy).

### Fixed
- Root `.gitignore` no longer excludes `apps/web/src/lib/` (prior critical fix).
