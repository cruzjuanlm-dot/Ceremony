# CLAUDE.md — Ceremony

Ceremony is the wedding-planning spin-off of Libretto. It lives in `ceremony/` inside the
Libretto repo (option D, owner decision 2026-10-07) and **borrows Libretto's design layer** so
UI work on Libretto flows into Ceremony automatically. Read the repo-root `CLAUDE.md` and
`docs/engineering/DESIGN_LANGUAGE.md` too — Ceremony follows the same design language.

## Product shape

**One app, two plans** (owner decision): **Pro** for wedding planners running many weddings
(clients, planner fee installments, preferred vendors), **DIY** for a couple running their own
single wedding. The plan lives on the workspace (`workspace.plan`); it decides which nav items
and features show. Never fork a screen per plan — branch inside it.

Navigation is the owner's sketch: Dashboard · Weddings · Clients (Pro) · Vendors · Financials ·
Calendar & planner · Email log · Contracts & docs · Design studio (placeholder) · Settings.

Research behind the product: `ceremony/docs/WEDDING_INDUSTRY_RESEARCH.md`.

## Demo mode (current state)

No backend, no auth. All data lives in the browser (`src/data/store.ts`, localStorage, one
dataset per plan), seeded from `src/data/seed.ts` with dates **relative to today**. The header's
"Demo as" switch flips Pro ⇄ DIY; Settings can reset the demo.

- Components read/write ONLY through `src/data/hooks.ts` (`useRows`, `useInsert`, `useUpdate`,
  `useRemove`, `useWorkspace`…). Never touch localStorage or `store.ts` from a component.
- `store.ts` is Supabase-shaped on purpose. Going live = replacing that one file with
  `supabase.from(table)` calls + the tables in `src/data/types.ts`. Nothing else should change.

## The doorway — how Ceremony shares Libretto's UI (and how not to)

| Import | Resolves to | Allowed? |
|---|---|---|
| `~/…` | `ceremony/src/…` | Ceremony's own code |
| `@libretto-ui/<name>` | `src/components/ui/<name>` | Yes — Libretto's shadcn primitives |
| `~/shared/libretto` | re-exports `cn`, `PageHeader`, `BackButton`, cell-control classes | Yes |
| `@/…` | Libretto's `src/` | **Only inside `src/shared/`** (lint-enforced) |

Rules:
1. Ceremony may import Libretto's **design layer** only. Never Libretto's domain code
   (`finance.ts`, Supabase clients, Libretto pages, Libretto's sidebar content).
2. **Libretto must never import from `ceremony/`.** The dependency is one-way.
3. Theme: `src/styles.css` imports Libretto's stylesheet and overrides only `--accent-brand`
   (+ a few surface tints) and adds `--font-display`. Never copy Libretto tokens here.
4. Ceremony declares no dependencies of its own; it uses the repo-root `node_modules` (one
   React, one Radix, one Tailwind for both apps). If Ceremony ever needs a package Libretto
   doesn't have, add it to the ROOT package.json in its own commit and say why.
5. Splitting into its own repo later = vendor/package `src/components/ui` + the files
   re-exported by `src/shared/libretto.ts`, then point the aliases at the copy. That is the
   whole seam; keep it that way.

A Libretto UI change can break Ceremony's build (never the reverse). After pulling Libretto
changes, run Ceremony's checks.

## Domain rules

- **The wedding is the atomic unit** — it owns its budget, guests, vendors, timeline, checklist.
- **Money math lives in `src/lib/finance.ts` only** (Libretto's rule, Ceremony's own copy —
  wedding money is different: no tickets, no break-even, no ticket-tax base). Don't sum budget
  lines or payments in a component.
- **Every budget line carries estimate AND actual.** Projected = actual ?? estimate.
- **Blank is not zero** — show "—" for unknown amounts.
- **Outgoing payments** (to vendors) and **incoming payments** (Pro: the planner's fee from the
  couple) are different businesses' money. Never net them together.
- **Lifecycle is derived** from the date (`weddingPhase()` in `src/lib/wedding.ts`), never stored.
- Labels for categories, stages, statuses come from `src/lib/wedding.ts`; status colours from
  `src/components/status.tsx`. One vocabulary.
- All seeded businesses and people are fictional.

## UI kit

`src/components/kit.tsx`: `StatTile`, `Panel`, `Chip` (+ `Tone`), `EmptyState`, `Meter`,
`CoupleName` (the serif — couple names and the wordmark only). Tone meanings follow
DESIGN_LANGUAGE §6: green = paid/booked/good, red = overdue/over/bad, amber = due soon/pending,
blue = budgeted/expected, brand = Ceremony accent.

## Commands (run from `ceremony/`)

```
../node_modules/.bin/vite              # dev server, http://localhost:8081
../node_modules/.bin/tsc --noEmit -p . # typecheck
../node_modules/.bin/eslint .          # lint (includes the doorway rule)
../node_modules/.bin/vite build        # production build → dist/
```
(`bun install` at the repo root first. `bun run dev` etc. also work from `ceremony/`.)

## Deploy

Vercel project `ceremony` (team `even-tech`), Root Directory `ceremony`, settings from
`ceremony/vercel.json`: installs at the repo root, builds with Vite, SPA rewrite, and an
ignored-build step that skips deploys unless `ceremony/` or the shared Libretto UI files changed.
