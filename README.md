# EPA Mock Assessment Simulator

Personal practice tool for the Software Developer Level 4 EPA (ST0116):

- **Professional discussion (AM2)** — 60 min, based on the portfolio
  (`reference/portfolio.pdf`). Questions reference specific pages/placements
  (Team Nebula / Team Yoda / Team Yeti).
- **Comfort break** — 30 min.
- **Project questioning (AM1)** — 60 min, based on the work-based project
  report (questions are generic to the future project).

Distinction-tagged KSBs (verified against Accelerate People's assessment
criteria, Aug 2026): AM1 → K6, S1, S7, S11; AM2 → K4/S15/B7 (one cluster),
K7, K12.

## Stack

Next.js (App Router) · TypeScript · Tailwind · Drizzle ORM · Neon Postgres
(via Vercel Marketplace) · Recharts · deployed on Vercel.

No auth — single user. Gate the deployment with Vercel's built-in password
protection (Project → Settings → Deployment Protection), not a login system.

## Setup

```bash
npm install

# Provision Neon through the Vercel Marketplace (the old first-party
# Vercel Postgres is sunset — don't use @vercel/postgres):
vercel install neon
vercel env pull .env.local   # brings DATABASE_URL down for local dev

# Create the sessions table:
npm run db:push

npm run dev
```

Without `DATABASE_URL` the app still runs — sessions just can't be saved and
the dashboard shows a setup notice.

## How it works

- **Landing page** — pre-flight checklist, opt-in camera/transcript (both off
  by default; no permissions requested unless opted in), distinction-cluster
  summary, and buttons for a full simulation or a single phase.
- **Session** — timed phases with pause/resume, end-phase-early, and an
  auto-advance confirmation overlay on timeout (15 s grace, +2 min escape
  hatch). Questions are shuffled per phase, one at a time, reshuffled when
  the bank is exhausted; each shows its KSB tags, portfolio ref (discussion
  only), and the distinction lens box where applicable.
- **Camera** (opt-in) — local `getUserMedia` + `MediaRecorder`, self-playback
  and a local download link only. Recordings never leave the browser.
- **Transcript** (opt-in) — Web Speech API live captions. The slice since the
  last "next question" click is checked against an evaluative-language regex
  on distinction-tagged questions; a miss is framed as "worth another pass",
  never a score. wpm/filler numbers are rough self-review indicators and
  labelled as such.
- **Debrief** — per-phase time, questions covered, wpm/fillers (if transcript
  was on), notes; saving writes one `sessions` row per completed phase.
- **Dashboard** — Server Component reads (direct Drizzle, no API round-trip):
  wpm trend, distinction-flag hit rate, time per phase, a 38-KSB coverage
  grid (distinction KSBs marked ★ with a gold ring), and an expandable
  session history table. The save path is a server action (`src/app/actions.ts`).

## Deliberately not included

Automated body-language/eye-contact scoring, a login system, or fake precision
on the speech metrics.
