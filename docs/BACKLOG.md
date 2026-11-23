# Ceremony backlog

Audited against the owner navigation sketch and `docs/WEDDING_INDUSTRY_RESEARCH.md` (sections 4–5). Demo mode only: browser store, no auth. One screen per feature; Pro and DIY branch inside it.

## Shipped in the demo

| Sketch | What exists |
|---|---|
| Dashboard | Pro portfolio by phase, payments, tasks. DIY countdown for the one wedding. Nothing is edited here. |
| Weddings | Record, budget (estimate and actual), guests (household, RSVP, meal, list seating), timeline and call sheet, vendor pipeline, checklist, logistics (room blocks, rain plan, license card), documents. |
| Clients (Pro) | Inquiry → booked pipeline, service level, flat planning fee, fee installments. Hidden on DIY. |
| Vendors | Directory, preferred flag, per-wedding booking and balance. |
| Financials | Pro: client fees and vendor bills, never netted. DIY: the couple’s budget and outgoing payments. |
| Calendar & planner | Month plus agenda, appointments, tasks, unpaid installments. |
| Email log | Manual threads, per wedding. |
| Contracts & docs | Links (not files), status, vendor and client. |
| Settings | Workspace, plan, demo reset, plan switch. |
| Tip envelopes | Editable envelope, cash vs. bill, who hands it over. Dollars are Gratuities budget lines. |

## Next, in order

1. **Planner fee models (Pro).** The fee is one flat number. Research requires flat, percent of the wedding budget, hybrid, and hourly, with the percent computed in `src/lib/finance.ts` from the budget total. Installments should follow that number.
2. **A new wedding should arrive with a plan.** `New wedding` saves an empty record. Seed the category budget and a months-out checklist (`due` offset from the date). Add the PR/FL and Catholic packs as real tasks — Logistics currently shows them as a read-only card, and several lines are still marked verify.
3. **Service charge and tax.** Catering and venue contracts need `serviceChargeAndTax()` in `finance.ts` (about 18–22% plus tax). That amount is not a tip. The budget line should show it beside the contract.
4. **Sub-events.** Welcome party, rehearsal, ceremony, cocktail, reception, after-party, brunch: each with a venue, a guest subset, and its own rain plan. Today there is one date, one rain note, and one guest list.
5. **Named contributors.** `paidBy` is couple / family / other. Parents and padrinos need names, tied to the lines they cover.
6. **Per-vendor timeline.** The call sheet lists arrivals. A vendor still cannot open a timeline that shows only their cues.
7. **Planner templates.** The timeline has “Start from template.” Checklist, timeline, and vendor rosters are not reusable across weddings.
8. **Guest RSVP page.** The list exists. There is no couple-facing EN/ES RSVP link. Households are a text field, not their own record (no mailing address).

## Explicitly later

- **Design studio.** Placeholder on purpose. List seating on the wedding is the v1. Drag-and-drop floor plans stay deferred.
- **Gmail / Outlook.** The inbox is a manual log. Two-way sync is out of demo scope.
- **Client portal, team seats, “hire a planner” hand-off, Español UI.** Each needs accounts or a second language pass. The portal is free couple logins in the pricing notes, not a demo screen.
- **Website, registry, vendor marketplace, e-sign.** Deferred in the research. Documents stay links.
