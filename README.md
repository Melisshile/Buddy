# Buddy

Voice-first AI companion for becoming an AI Engineer.

## Stack (v1)

- **Frontend:** React + Vite + TypeScript + Tailwind + PWA
- **Backend:** Firebase (Auth, Firestore, Storage, Functions, Hosting, App Check)
- **AI:** AI Gateway → Gemini adapter (Firebase AI Logic) or mock adapter
- **Offline:** IndexedDB local-first reads + Firestore sync
- **Voice:** Web Speech API behind Voice Engine interfaces

## Monorepo

```
apps/web          React PWA
packages/shared   Types + AI / memory / voice interfaces
functions         Cloud Functions
```

## Quick start (demo, no Firebase)

```bash
npm install
npm run build:shared
cp .env.example apps/web/.env
# leave Firebase keys empty; VITE_USE_AI_MOCK=true
npm run dev
```

Open http://localhost:5173 → **Enter demo mode**.

## Firebase setup

1. Create a Firebase project; enable Auth (Google + Anonymous), Firestore, Storage, Hosting.
2. Enable **Firebase AI Logic** / Gemini for the web app.
3. Copy web config into `apps/web/.env` from `.env.example`.
4. Set `VITE_USE_AI_MOCK=false` when ready for live Gemini.
5. Deploy rules & hosting:

```bash
npm run build
firebase deploy
```

Optional App Check: set `VITE_RECAPTCHA_SITE_KEY`.

## Architecture rules

1. UI never calls model providers directly — only via **AI Gateway**.
2. Buddy **reads IndexedDB first**; Firebase syncs.
3. Voice modules are swappable (Web Speech now; whisper.cpp / Piper later).

## Companion commands

- “What should I work on today?”
- “Teach me embeddings”
- “Quiz me on RAG”
- “Remember that I prefer TypeScript”
- “Summarize what I learned this week”

## Deploy (project: buddy-46cbb)

```bash
npm run build
firebase deploy --only firestore,hosting --project buddy-46cbb
```

- **Hosting:** https://buddy-46cbb.web.app
- **Cloud Functions** need the Blaze plan: upgrade at https://console.firebase.google.com/project/buddy-46cbb/usage/details then `firebase deploy --only functions --project buddy-46cbb`
- **Storage:** enable in console first, then `firebase deploy --only storage --project buddy-46cbb`

Functions are **not** in the npm workspaces (Firebase needs its own `functions/node_modules`).

