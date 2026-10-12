# CLAUDE.md — Ceremony

Ceremony is the wedding-planning spin-off of Libretto. It started in `ceremony/` inside the
Libretto repo (2026-10-07) and was **split into its own repo on 2026-10-12** (owner decision:
sharing a repo made every Libretto push trigger a failing Ceremony build on Vercel). It keeps a
**vendored copy of Libretto's design layer** in `src/libretto/`. Read `docs/DESIGN_LANGUAGE.md`
(copied from Libretto) — Ceremony follows the same design language.

## Product shape

**One app, two plans** (owner decision): **Pro** for wedding planners running many weddings
(clients, planner fee installments, preferred vendors), **DIY** for a couple running their own
single wedding. The plan lives on the workspace (`workspace.plan`); it decides which nav items
and features show. Never fork a screen per plan — branch inside it.

Navigation is the owner's sketch: Dashboard · Weddings · Clients (Pro) · Vendors · Financials ·
Calendar & planner · Email log · Contracts & docs · Design studio (placeholder) · Settings.

Research behind the product: `docs/WEDDING_INDUSTRY_RESEARCH.md`.

## Demo mode (current state)

No backend, no auth. All data lives in the browser (`src/data/store.ts`, localStorage, one
dataset per plan), seeded from `src/data/seed.ts` with dates **relative to today**. The header's
"Demo as" switch flips Pro ⇄ DIY; Settings can reset the demo.

- Components read/write ONLY through `src/data/hooks.ts` (`useRows`, `useInsert`, `useUpdate`,
  `useRemove`, `useWorkspace`…). Never touch localStorage or `store.ts` from a component.
- `store.ts` is Supabase-shaped on purpose. Going live = replacing that one file with
  `supabase.from(table)` calls + the tables in `src/data/types.ts`. Nothing else should change.

## The doorway — Ceremony's copy of Libretto's UI

| Import | Resolves to | Allowed? |
|---|---|---|
| `~/…` | `src/…` | Ceremony's own code |
| `@libretto-ui/<name>` | `src/libretto/components/ui/<name>` | Yes — the vendored shadcn primitives |
| `~/shared/libretto` | re-exports `cn`, `PageHeader`, `BackButton`, cell-control classes | Yes |
| `@/…` | `src/libretto/…` | **Only inside `src/shared/` and `src/libretto/`** (lint-enforced) |

Rules:
1. `src/libretto/` is a **copy** of Libretto's design layer as of the split (from the
   `ceremony` branch of `cruzjuanlm-dot/event-production-system`, commit `d728409`). It does
   NOT update itself. Treat it as vendored: don't edit it for Ceremony-only needs — override in
   `src/styles.css` or wrap in `src/components/` — so a re-sync stays a straight copy.
2. **Re-syncing from Libretto** = copy the same paths from Libretto's `src/` over
   `src/libretto/` (`components/ui/*` that exist here, `components/page-header.tsx`,
   `components/cell-control-classes.ts`, `hooks/use-mobile.tsx`, `lib/utils.ts`, `styles.css`
   — then change its `@source "../src"` line back to `@source "./"`), add any new packages
   they need, and run the checks below.
3. Theme: `src/styles.css` imports `src/libretto/styles.css` and overrides only
   `--accent-brand` (+ a few surface tints) and adds `--font-display`.
4. Never pull Libretto **domain** code in (`finance.ts`, Supabase clients, Libretto pages).

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

## Commands

```
bun install          # once
bun run dev          # dev server, http://localhost:8081
bun run typecheck    # tsc --noEmit
bun run lint         # eslint (includes the doorway rule)
bun run build        # production build → dist/
```

## Deploy

Vercel project `ceremony` (team `even-tech`), connected to this repo, Root Directory blank,
production branch `main`. Settings from `vercel.json`: `bun install`, Vite build, SPA rewrite.
Production URL: https://ceremony-iota.vercel.app (public; preview deployments need a Vercel
login).
