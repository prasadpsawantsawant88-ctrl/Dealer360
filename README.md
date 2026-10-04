# Dealer360 — Enterprise Dealer Performance Platform

**From Signal to Improvement. Every Time.** An interactive Next.js prototype built from the Dealer360 Product Walkthrough PDF. Operating model: SENSE → ASSESS → DIAGNOSE → PRIORITISE → ACT → MEASURE → LEARN.

## Business problem
Dealer sales numbers alone hide the causes of decline. Dealer360 joins health scoring, risk prediction, root-cause diagnosis, salesperson coaching, inventory and customer recovery into one workflow, then measures whether the intervention worked and learns from it.

## Architecture
Data → Health → Risk → Diagnosis → Intervention → Outcome → Learning

## Tech stack
Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3, Recharts, Lucide React. Local simulated JSON only: no database and no required environment variables. `jspdf` builds the dealer PDF reports in the browser.

## Run
```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Dealer PDF report
On any Dealer 360 page, **Download report** builds a multi-page PDF for that dealer in the browser: health score and trend, dimension scores against the regional median, KPI table, score contributions, diagnosis chain, complaint summary, sales team, inventory ageing and the 90-day plan. Dealers on Monitor status have no diagnosis or plan, so those sections show a short note instead. Code: `lib/dealerReport.ts`.

## Pitch training (AI Sales Coach)
`/coach/training` lets a salesperson record a spoken reply to a customer scenario. The browser records the audio (MediaRecorder) and turns speech into text (Web Speech API, Chrome and Edge). The text can be edited, then scored in the browser by `lib/pitchAnalysis.ts` on the five coaching objectives, with pace, filler words, a checklist and the first things to fix, each with a sample line from the practice scenarios. Browsers without speech-to-text can record and type the transcript, or skip recording and type the pitch.

Optional written coaching from Claude: copy `.env.example` to `.env.local`, set `ANTHROPIC_API_KEY`, restart. The page then also shows a summary, concrete improvements, a rewritten pitch and a practice drill from `app/api/pitch-feedback/route.ts`. Only the transcript text is sent, never the audio. Without a key that panel says it is switched on by key and everything else works. Microphone access needs `localhost` or HTTPS.

## Deploy to Vercel
1. Push the folder to a Git repository (or run `npx vercel` in this folder).
2. Import the project at vercel.com/new. Framework preset: Next.js (auto-detected).
3. Keep default build settings and deploy. No environment variables are needed; add `ANTHROPIC_API_KEY` only if you want the written coaching on Pitch Training.

## Folder structure
`app/` routes · `components/` shell, UI primitives, views · `lib/` data access, theme, coach script, keyword classifier · `hooks/` · `data/` JSON + `data_dictionary.md` · `scripts/generate-data.ts` seeded generator (`npm run generate-data`).

## Data architecture
All numbers come from a seeded simulation (`npm run generate-data`), not from the source PDF. 150 dealers, about 540 salespeople, about 4,400 complaints, 2,400 stock rows and 600 intervention cases; see `data/data_dictionary.md` for how the pieces connect.

## ML simulation
Health-score weights are fitted by regression on simulated history (with bootstrap confidence ranges), deterioration risk comes from a logistic regression, recovery funnels come from simulated case workflows, and the 90-day outcome uses difference-in-differences against simulated control dealers. These are real calculations on **simulated** inputs, so they illustrate the method but say nothing about real dealers. The complaint classifier is a keyword scorer; Inventory Optimizer scenario effects are simple elasticities.

## Demo walkthrough (5–7 minutes)
Use the "Next" button at the bottom right of every page.
Network (Overview) → Priority Queue → ABC Motors (Dealer 360, the top-ranked dealer with a flagged salesperson) → Explainability → Diagnosis → Complaints → Rahul Sharma → AI Sales Coach (click START PRACTICE, pick replies) → Coach Analysis (your session overlays the recorded pitch) → Coaching Impact → Pitch Training (record or type a pitch) → Inventory scenarios → Action Plan (drag the day slider) → Outcomes → Learning Loop.

## Notes
- The dealer picker on each page switches between queued dealers; the choice carries across pages.
- Fonts load from Google Fonts at runtime (Poppins, Inter) with system fallbacks.
- Contact details on the Methodology page come from the source walkthrough and are placeholders.
