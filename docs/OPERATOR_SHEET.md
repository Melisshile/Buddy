# Buddy AI 2.0 — Operator Sheet (print this)

**Keep beside you during live demos. Presentation aid only.**

---

## Access

| Item | Value |
|------|--------|
| **Demo URL** | https://buddy-46cbb.web.app |
| **Backup** | `npm run dev` → http://localhost:5173 (same machine) |
| **GitHub** | https://github.com/Melisshile/Buddy |
| **Firebase project** | `buddy-46cbb` |
| **Browser** | Chrome (preferred) or Edge — typed input on stage |

## Env confirmation (before going on)

| Check | OK? |
|-------|-----|
| Hosting shows current build (Dashboard + career CTAs) | ☐ |
| OpenAI live **or** coach fallback labeled honestly | ☐ |
| `VITE_USE_AI_MOCK=false` when claiming OpenAI | ☐ |
| Proxy/key configured (server-side preferred) | ☐ |
| Functions on Blaze? (if using proxy) | ☐ / N/A |

## Exact demo order

1. Developer Menu → **Reset Demo** → confirm reload  
2. Show Dashboard — Welcome back · Auth yesterday · **42%**  
3. **Start career path** / type: `I want to become an AI Engineer.`  
4. Point at status beats (Planning → Twin → Roadmap → Saving)  
5. Show Learning Plan + today’s goal  
6. Type: `Build today's project.`  
7. Back to **Dashboard** — goal / ~43% / tasks  
8. Close: *Buddy doesn’t just answer questions… learn, build, and grow.*

**Do not mention:** Document Agent, vision, streaming, RAG, wake word.

## Recovery

| Problem | Action |
|---------|--------|
| Wrong dashboard state | **Reset Demo** |
| Stuck / weird UI | Refresh, then Reset Demo |
| OpenAI fails | Continue with coach; say “offline coach fallback” — never fake OpenAI badge |
| Mic issues | Type the exact phrases (preferred on stage anyway) |
| Blank / old PWA | Hard refresh or Incognito |
| Totally broken hosting | Switch to localhost backup |

## Closing line

> Buddy doesn’t just answer questions. It continuously helps people learn, build, and grow throughout their careers.

## vs ChatGPT (if asked)

> ChatGPT helps in the moment. Buddy tracks goals, plans, and growth over time.

---

*After 20 rehearsals + validation: tag `v2.0.0-buildweek-final` — then only critical bugs.*
