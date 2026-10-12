# Design language

The interaction vocabulary for Libretto. Read this before adding UI.

**Why this file exists.** On 2026-07-26 an audit counted **three different verbs** for "make a
new thing", **five hand-rolled copies** of the same segmented control (disagreeing on radius,
background and type size), and a shared `ToggleGroup` component used in exactly **one** file.
Nothing was wrong individually — each screen was locally reasonable — but a user has to
re-learn the app on every screen when patterns don't repeat. That is what "convoluted" and
"vibe coded" actually describe, and it accumulates one reasonable decision at a time.

The rules below are cheap to follow and expensive to skip.

---

## 1. One verb per action

| Verb | Means | Examples |
|---|---|---|
| **New** | Creates a standalone object that can exist on its own | New event · New tour · New venue · New person · New vendor |
| **Add** | Attaches a line or child to something that already exists | Add line · Add category · Add flight · Add hotel · Add avail · Add room |

**Nothing says "Create".** It's a third word for jobs the first two already cover.

This applies to control labels — buttons, menu items, dialog titles, empty-state CTAs. Ordinary
prose stays ordinary English ("Create your first event to start tracking profit" is a sentence,
not a button, and forcing the rule on it reads worse).

## 2. One segmented control

`src/components/ui/segmented-control.tsx`. Anything switching between a few mutually exclusive
views uses it. Do not hand-roll another.

```tsx
<SegmentedControl
  aria-label="Which events"
  value={mode}
  onValueChange={setMode}
  options={[
    { value: "upcoming", label: "Current" },
    { value: "past", label: "Past" },
  ]}
/>
```

Navigation that *looks* segmented (the Resources tabs) can't use the button version — router
links need their own typed `to`. Those import `segmentedShell()` / `segmentedItem()` from the
same file, so the styling still has exactly one source.

Use `aria-pressed`, not `aria-selected` — these are toggle buttons in a group, not tabs
controlling panels. `aria-selected` outside a `tablist` is wrong.

## 3. Inline edit vs. dialog

- **Inline** — editing one field on something that already exists. Click the value, type, blur
  commits. The event page's title, city, date and show-time fields are the reference.
- **Dialog** — creating a new object that needs several fields at once, or a destructive
  confirmation.

Never open a dialog to change one field. Never make someone create a multi-field object through
six separate inline edits.

Any dialog past ~8 fields needs `max-h-[90vh] overflow-y-auto`, or its top scrolls out of reach.

## 4. One hero per screen

Every screen has **one** dominant element; everything else is subordinate. A flat grid of
equal-weight panels reads as a dashboard — and a wall of dashboards is what makes the app feel
like disconnected reports rather than one product.

Template: **hero → supporting → detail.**

- Hero: the single number or object the screen exists for.
- Supporting: two or three things that qualify the hero.
- Detail: tables, line items, everything you only look at deliberately.

Tables are for genuinely tabular data. They are not the default surface for a feature — 10 of
~15 surfaces were tables at audit time, which is why the app looked like the spreadsheet it
replaces.

## 5. One Pro mode, not per-feature toggles

Advanced capability hides behind **one** account-level switch, not a growing set of independent
ones. Four independent toggles is sixteen states to design, build and verify — and they don't
vary independently in real life: a producer who works backend deals also works hold ladders.

Currently gated (or planned to be): budget-vs-actual tracking, artist deal structures
(guarantee vs. versus vs. backend), the ranked hold ladder, potential/actual/budget views.

If a new switch seems necessary, it almost certainly belongs inside Pro mode instead.

## 6. Money, colour and state

- Money math comes from `src/lib/finance.ts`. Never reimplement it in a component.
- Green = earned/positive. Red = cost/negative. **Blue = budgeted/expected.** Violet = the
  what-if "potential". These are fixed; don't reuse blue for an unrelated accent.
- Never carry meaning by colour alone — pair it with a label, icon or sr-only text.
- Blank vs zero is a real distinction. A field nobody has filled shows "—", never "$0.00".

## 7. No explainer copy

**Don't narrate the interface.** A promoter opening a screen wants to do the work, not read a
paragraph about how the screen functions. Sentences that restate what the UI already shows
read as machine-written filler and are the first thing users call "AI garble".

Cut on sight:

- Pipeline/stage narration — "Contacted → Quoted → Negotiating → Booked. Booking posts the
  agreed price to this event's budget." The board already shows the stages; the behaviour is
  learned by using it once.
- Mechanic descriptions — "Times are editable in place — changing one never moves the others.
  Overlaps within a department get flagged."
- Any subtitle that would still be true with the feature removed.

What earns its place instead: a **label** naming the thing, an **empty state** that says what
to do first, an **error** that says what went wrong and what to do, and a **warning** where
money or data is at stake. If a behaviour genuinely needs explaining, the design is wrong —
fix the design rather than captioning it.

Templates follow the same rule. A default that ships 40 rows nobody needs is worse than one
that ships 8 and gets added to: deleting is work, and unread detail is noise.

---

Related: `DEFINITION_OF_DONE.md` for the shipping bar, and `CLAUDE.md` for domain rules and
platform gotchas.

## 8. One table

Every table renders through the primitives in `src/components/ui/table.tsx`. There is no
second table style, and no hand-rolled `<table>` with its own padding and rules.

This rule exists because there were two. The expense grid was a raw `<table>` and the vendor
list was shadcn's, and they disagreed on radius (`xl` vs `lg`), header treatment (grey fill +
uppercase vs no fill + sentence case), row rule (`border-t border-border/40` vs `border-b`),
hover tint (`/30` vs `/50`), cell padding (`px-2 py-1.5` vs `p-2`) and vertical alignment
(top vs middle). Side by side they read as two different products.

The format is the **quiet grid** (owner call 2026-08-22, ending the 08-20/08-21 trial after
all three states were rejected as "noisy, messy, all slightly different" — history in
`TABLE_RESTYLE_2026-08-20.md`). Its premise: the noise was never the table skin, it was the
**chrome inside the cells** — a chevroned dropdown on every row, always-visible trash cans,
headers indistinguishable from data. So the format has two halves: shadcn's geometry, and a
contract that a cell reads as TEXT until you interact with it.

- **No card, no outer border.** A table sits directly on the page and ends on its last row
  rule. `TableShell` draws no border — it owns the title/actions row and the gap beneath it.
  Callers must not re-wrap a table in `rounded-lg border bg-card`; six of them did, and that
  is what the uncarding removed.
- **Header:** `h-10`, `px-2`, `font-medium`, **`text-muted-foreground`**, sentence case,
  `align-middle`. Muted so the labels sit behind the data instead of competing with it. Not
  `11px` tracked caps — a promoter scanning a budget reads "Amount"; they do not decode
  "AMOUNT". One full-weight hairline under the header row, no fill.
- **Cells:** `p-2`, `align-middle`, `whitespace-nowrap`. Wide content scrolls the table rather
  than wrapping a row to two lines.
- **Hairline rules between rows**, `border-border/60`, drawn on the CELLS. Row dividers
  separate, they don't frame: full weight belongs to the header, section bands and footer.
  Cell-borne rules are an intentional departure from stock shadcn, which puts `border-b` on
  the `<tr>`: a row border does not paint under `border-separate`, and the separated model is
  what lets a `<col>` tint sit beneath the rule and under the row hover (the expense grid and
  income section both depend on it).
- **Hover is the only row highlight** (`bg-muted/50`). No zebra striping.
- **In-cell controls are invisible at rest** — the recipes live in
  `src/components/cell-control-classes.ts` and every editable cell uses them
  (`CellNumber`, `CellSelect`, `cellControlClass` on inputs, `cellTriggerClass` on Radix
  triggers). At rest a control renders as plain text: no border, no background, **no
  chevron**. Hovering the ROW hints the row's chevrons faintly; hovering or focusing the
  control itself shows the full affordance (border + background + chevron); touch devices
  see the affordances always. Never place a stock bordered `Input`/`SelectTrigger` inside a
  table cell.
- **Row actions ride the same contract** — delete buttons and "…" menus take
  `cellActionClass`: hidden until the row is hovered, the button focused, or its own menu
  open. A grid must never show a column of trash cans at rest.
- **Blank cells show nothing, or "—"** — never a grey "0" placeholder. Blank and zero are
  different facts (§6), and a placeholder digit in every empty row is noise that lies.
- **`numeric`** on `TableHead`/`TableCell` right-aligns and sets tabular figures. Every money
  and count column takes it — never re-specify `text-right tabular-nums` by hand.
- **`TableSectionRow`** for in-body bands (the expense grid's categories, Staffing) — not a
  stock primitive. Air above the label and a hairline under it, no fill, never a double rule.
  It sets SPACING ONLY: a `[&>td]:text-*` on it outranks the cell's own class and would
  flatten the expense grid's over/under money colours.
- **`TableFooter`** for totals — `bg-muted/50`, a top rule, `font-medium`.
- **`TableHead` carries `bg-background`**, also not stock, and it is load-bearing:
  staffing-sheet's sticky first column has to paint over the cells scrolling under it, and
  there is no card fill left to inherit.

**Print documents are the one exception.** The tables inside a `hidden print-show` block
(tour-rollup's P&L, hotel-detail's quote, the schedule day sheet) deliberately use black
rules and no card chrome — paper has no hover, no dark mode and no card. Don't "unify" them.

Two-row headers are allowed only where columns genuinely nest — Pro mode's Budget and Actual
each owning Cost / Qty / Amount. The group row carries `border-b-0` so it and the label row
read as one band.

## Page chrome: one header, one back

Every view renders `PageHeader` (src/components/page-header.tsx): title + description left,
actions right, `mb-6`, same type scale. No page hand-rolls its own `<header>` again.

Every DETAIL page (event, tour, venue) opens with `BackButton` in the same spot: real
`history.back()` when there is in-app history — back means "where I was", not "the list" —
with the object's list as the deep-link fallback. An event inside a tour also shows a tour
chip button next to Back (the promoter bounces show ↔ tour constantly). The peek variant
hides this row; the drawer header owns navigation there.

## Dashboard learns, Events works

Owner principle (2026-08-08): **the Dashboard is where users go to learn; Events is where
users go to work.** Concretely:

- The Dashboard never hosts editing. Everything actionable on it is a HANDOFF — a deep link
  to the tab where the work happens, or the peek. Its rows open the peek, not the page.
- Events is the only place the portfolio is enumerated and managed (lenses, bulk ops,
  inline edits, creation).
- Object pages (event, tour, venue) own their OWN analytics — per-object charts belong
  there, not on the Dashboard. The Dashboard is cross-portfolio only.
- Grandfathered exception, on purpose: the Dashboard header's New event / New tour buttons
  (launchpad convenience). Don't add more work verbs there.

When a new surface doesn't obviously fit one side, it's probably two surfaces.
