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
| Planner fee models (Pro) | Flat, percent of the budget target, hybrid, and hourly. `plannerFee()` in `src/lib/finance.ts` computes the number. Unpaid installments and the Planning line follow it. Blank inputs stay blank. |
| New wedding plan | Creating a wedding seeds estimates-only budget lines (research §6 categories), a months-out checklist, and a ceremony-relative timeline. |
| Service charge and tax | Venue and catering lines carry a service-charge percent and a sales-tax percent. `serviceChargeAndTax()` in `src/lib/finance.ts` turns those into dollars beside the contract. The amount is not a tip. Blank percents stay blank. Budget totals include the charge. |

## Next, in order

1. **Sub-events.** Welcome party, rehearsal, ceremony, cocktail, reception, after-party, brunch: each with a venue, a guest subset, and its own rain plan. Today there is one date, one rain note, and one guest list.
2. **Named contributors.** `paidBy` is couple / family / other. Parents and padrinos need names, tied to the lines they cover.
3. **Per-vendor timeline.** The call sheet lists arrivals. A vendor still cannot open a timeline that shows only their cues.
4. **Planner templates.** The timeline has “Start from template.” Checklist, timeline, and vendor rosters are not reusable across weddings. A new wedding uses one built-in starter, not a saved template.
5. **Guest RSVP page.** The list exists. There is no couple-facing EN/ES RSVP link. Households are a text field, not their own record (no mailing address).

## Legal tasks still open

A new wedding in Puerto Rico, Florida, or with a Catholic ceremony gets checklist tasks only for requirements `docs/WEDDING_INDUSTRY_RESEARCH.md` states outright (PR medical certificate and license window, FL 60-day license and resident wait, parish notice, Pre-Cana, baptismal and confirmation records, prenuptial interview). Lines the research marks **(verify)** — resident PR fee, divorce or death certificates, translations, whether Florida requires witnesses, the home-parish letter — stay on the Logistics card and are not tasks. Any other city gets one generic “Apply for the marriage license” task from the months-out list.

## Explicitly later

- **Design studio.** Placeholder on purpose. List seating on the wedding is the v1. Drag-and-drop floor plans stay deferred.
- **Gmail / Outlook.** The inbox is a manual log. Two-way sync is out of demo scope.
- **Client portal, team seats, “hire a planner” hand-off, Español UI.** Each needs accounts or a second language pass. The portal is free couple logins in the pricing notes, not a demo screen.
- **Website, registry, vendor marketplace, e-sign.** Deferred in the research. Documents stay links.
