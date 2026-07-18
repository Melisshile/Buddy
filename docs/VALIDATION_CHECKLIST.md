# Buddy AI 2.0 — Engineering Validation Checklist

**Purpose:** Prove it works. Not add features.  
**Pass rule:** Every row must pass **3 times in a row** before you mark it done.  
**Reset between runs:** Developer Menu → **Reset Demo** (then confirm reload).

---

## Day plan (remaining)

| Day | Focus | Success |
|-----|--------|---------|
| 1 | `VALIDATION_CHECKLIST.md` — **10 consecutive** passes per critical path | Trust |
| 2 | Record + watch demo — clear in 30 seconds? | Effortless story |
| 3 | Judge-as-reader on GitHub — What / Why / OpenAI / Different / Run / Built | Under 1 minute each |
| After 20 rehearsals | Tag `v2.0.0-buildweek-final` — freeze | Stability |

---

| Focus | Share | Activity |
|-------|-------|----------|
| Engineering validation | 40% | This checklist |
| Demo polish | 30% | `docs/DEMO_SCRIPT.md` until effortless |
| Repository | 20% | Docs, LICENSE, clean README |
| Buffer | 10% | Deploy / quota / typos |

---

## A. Critical paths

| # | Path | Steps | Pass? | Notes |
|---|------|-------|-------|-------|
| A1 | New user / demo | Reset Demo → Welcome back · 42% · Auth yesterday | ☐ | |
| A2 | Returning user | Complete Scene 3–4 → reload → twin persists | ☐ | Without Reset |
| A3 | Career roadmap generation | `I want to become an AI Engineer.` → 4-week plan + today’s goal | ☐ | |
| A4 | Tool / twin mutation | After A3, Developer Menu shows Twin updated ✓ | ☐ | |
| A5 | Build today’s project | `Build today's project.` → architecture + ~43% | ☐ | |
| A6 | Dashboard refresh | Back to Dashboard → goal / tasks / Growth Progress match | ☐ | |
| A7 | Status beats | Planning → Twin → Roadmap → Saving visible | ☐ | |
| A8 | Developer metrics | Model / provider / agents / latency populated | ☐ | |

## B. Failure modes

| # | Scenario | Expected | Pass? | Notes |
|---|----------|----------|-------|-------|
| B1 | Missing API key | Coach fallback · UI does **not** claim live OpenAI | ☐ | Unset `VITE_OPENAI_*` |
| B2 | OpenAI timeout / 5xx | Annotated fallback or clear error · app usable | ☐ | Throttle network or bad key |
| B3 | Offline | Offline indicator · coach path · no crash | ☐ | DevTools offline |
| B4 | Slow network | Loading/busy states clear · no double-submit chaos | ☐ | Slow 3G |
| B5 | Empty chat then demo | Empty workspace copy → career phrases work | ☐ | |

## C. Demo script (end-to-end)

Run full `docs/DEMO_SCRIPT.md` Scenes 1–5.

| Run | Environment | Pass? |
|-----|-------------|-------|
| 1 | Normal Chrome | ☐ |
| 2 | Incognito | ☐ |
| 3 | After Reset Demo | ☐ |
| 4 | Slow network | ☐ |
| 5 | Coach-only (no key) | ☐ |
| … | Continue to **20** total rehearsals | ☐ |

## D. Stop conditions

Stop validating and fix **only** if:

- Dashboard does not show 42% after Reset  
- Scene 5 does not reflect twin after build  
- Console errors block the flow  
- Provider badge lies (OpenAI when coach)

Do **not** start new features while any A/B row fails.

---

## Sign-off

| Role | Name | Date | All A+B pass ×3? |
|------|------|------|------------------|
| Presenter | | | ☐ |
| Backup operator | | | ☐ |

When signed: record the 90s video. Then submit per `docs/FINAL_SUBMISSION_CHECKLIST.md`.
