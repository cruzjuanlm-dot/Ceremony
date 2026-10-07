# Ceremony: Wedding Industry Research

Researched 2026-10-07 for **Ceremony**, the wedding spin-off of Libretto. It is one app with two tiers: **Pro** for planners and coordinators, and **DIY** for couples planning their own wedding.

> **How to read this.** Prices and statistics come from web searches run on 2026-10-07. Several first-party sites (theknot.com, aisleplanner.com, salud.pr.gov, beachbride.com, weddingpro.com) could not be fetched directly because the proxy blocked them, so many figures come from search-engine excerpts and third-party summaries of those pages. Anything marked **(verify)** should be confirmed at the primary source before it reaches customer-facing copy or a legal checklist. Legal requirements change, so treat Section 1.10 as a starting point, not legal advice.

---

## TL;DR

- **Weddings are not shows.** There is one client with two decision-makers plus their families, and the event happens once. Planning runs about 14 months ([The Knot 2026 RWS via search](https://www.theknot.com/content/average-wedding-guest-list-size)). The work centers on **guests** (RSVP, meals, households, seating), which Libretto lacks entirely, and on a **minute-by-minute day timeline**, which Libretto's schedule/day sheet already covers.
- **Money flows the other way.** A Libretto promoter earns ticket revenue and pays costs. A wedding **couple only pays**, through deposits, milestone payments and a final balance per vendor. A **planner** earns a fee from the couple and tracks vendor bills on the couple's behalf. So "P&L" becomes **budget vs. actual plus a payment schedule**.
- **Pricing (recommended):** **Pro at $59/mo** (Solo, 1 seat, up to 15 active weddings) and **$99/mo** (Studio, 3 seats, unlimited weddings), plus **$15/mo per extra seat**, with a 14-day trial. **DIY at $79 one-time** per wedding with 24 months of access, plus a free tier that is limited to the budget and a 50-guest cap. Libretto is $49/mo, and the Pro tiers sit in the HoneyBook/Aisle Planner band.
- **Top differentiators:**
  1. Vendor payment schedule plus gratuity tracking, with real budget-vs-actual (inherited from Libretto's finance engine).
  2. A bilingual, PR/FL-aware legal and traditions checklist that covers PR's marriage license, Catholic Pre-Cana, padrinos and arras.
  3. One planner workspace with a shared client portal, which replaces the HoneyBook-plus-Aisle-Planner-plus-spreadsheet stack.
  4. Destination-wedding logistics (room blocks, welcome party, travel) inherited from Libretto Hospitality.
  5. A hurricane-season rain plan.

---

## 1. What makes wedding planning distinct from event production

### 1.1 The client is a couple plus families, not a promoter

| Libretto (promoter) | Ceremony (wedding) |
|---|---|
| One decision-maker (the promoter) who owns the P&L | **Two decision-makers** (the couple), plus parents who often pay a share and therefore have opinions |
| Repeat customer with many shows a year | **One-shot customer.** Their lifetime value is a single wedding, and referrals matter more than retention |
| Success means the show made money | Success means the day felt right, nothing visibly went wrong, and the couple stayed on budget |
| Emotionally neutral data | Emotionally loaded data: guest-list politics, divorced parents, deceased relatives honored during the ceremony |

Product implications:
- **Multiple client contacts per wedding.** Partner A, Partner B, and optional family "payers" or "contributors" each need a role.
- **Contribution tracking.** Track who pays for what, for example "bride's parents cover catering".
- **Approval flows** go through the client portal, so the planner can have the couple approve a vendor or timeline.

### 1.2 Long lead times

- The average engagement is **about 14 months**. The 2022 cohort averaged 15 ([The Knot RWS 2026 via search](https://www.theknot.com/content/average-wedding-guest-list-size); [The Knot 2022 RWS](https://www.theknot.com/content/wedding-data-insights/weddings-in-2022)).
- Full-service planners typically engage **12–18 months out**, and partial planners **3–6 months out** ([planner cost summaries](https://loverly.com/planning/budget/wedding-planner-cost)).
- Implication: a Pro account runs **10–30 weddings at once**, each at a different "months-out" stage. The dashboard should group weddings by stage (for example ">9 mo", "6–9 mo", "<90 days", "this week").

### 1.3 Checklist by months out (the canonical template)

This synthesizes several sources ([Bridebook timeline](https://bridebook.com/uk/article/wedding-planning-timeline), [Inspired Bride checklist](https://www.inspiredbride.net/?p=68078), [A Practical Wedding PDF](https://apracticalwedding.com/wp-content/uploads/2020/04/every-wedding-checklist-you-need.pdf)).

| Months out | Typical tasks |
|---|---|
| 12–18 | Set the budget and who contributes. Draft the guest list (A/B lists). Pick a date. Book the venue and planner. Book the photographer and videographer. For a Catholic ceremony, contact the parish (6–12 months' notice is typical). |
| 9–12 | Book the caterer (if not in-house), band/DJ, florist and officiant. Reserve hotel room blocks. Build the wedding website. Send save-the-dates (6–8 months; 8–12 for a destination wedding). Shop for attire. |
| 6–9 | Book HMUA, cake, rentals and transportation. Hold design meetings (decor, florals). Start Pre-Cana if Catholic. Plan the rehearsal dinner and welcome party. |
| 4–6 | Do the menu tasting. Order invitations. Buy rings. Choose padrinos/madrinas. Get attire fittings. |
| 2–3 | Mail invitations (6–8 weeks before). Apply for the marriage license (watch the PR 10-day medical window and Florida's 60-day validity). Draft the day-of timeline. |
| 1 | Finalize headcount and meal counts with the caterer, plus the seating chart. Send the final timeline to vendors. Make final payments. Prepare tip envelopes. |
| Week of | Hold the rehearsal. Deliver welcome bags. Assemble the emergency kit. Confirm vendor arrival times. |
| After | Pay any remaining balances. Send thank-you notes. Return rentals. File the license (the officiant usually handles this). |

**Product note:** this is seed data. A checklist template should generate tasks with a `due_offset_days` relative to the wedding date, so the same template works for any date.

### 1.4 Guests and RSVP (Libretto has no equivalent)

Guests are the heart of the DIY tier and a large time sink for Pro planners. The needed concepts:
- **Households/parties.** Invitations go to a household ("The García Family"). RSVPs come back per person. Mailing addresses live on the household.
- **Plus-ones.** These can be allowed but unnamed ("Guest of X"), named, or not allowed.
- **Children.** Track whether they are invited and whether a kids' meal applies.
- **Per-event invitations.** Some guests are invited to the welcome party, the rehearsal dinner or the after-party, and others are not. One guest list must cover many sub-events.
- **Meal choice per attending guest** (for example beef / fish / vegetarian / kids), plus **dietary restrictions and allergies**, free text plus tags.
- **A/B lists.** The B list gets invited as A-list declines come in, so track priority and invite waves.
- **Side and relationship**, for example "Partner A's family", "college friends". Used for seating and reporting.
- **RSVP status:** not sent, invited, attending, declined, no response, plus an RSVP deadline.
- **Song requests, addresses, and gift/thank-you tracking.**
- RSVP sync reliability is a top complaint about The Knot: reviewers report lost responses "at the worst possible time" ([unstar.app comparison](https://unstar.app/blog/zola-the-knot-joy-weddingwire-minted-wedding-planning-apps-ranked-2026)). Correctness of the headcount is a differentiator.

The average guest count is **117** ([The Knot 2026 RWS via search](https://www.theknot.com/content/average-wedding-guest-list-size)).

### 1.5 Seating charts

- Tables have a shape (round 8–10, banquet, sweetheart, head table) and a capacity.
- Guests are assigned to a table, sometimes to a specific seat. Couples can be kept together, conflicts kept apart, and meal choice is shown per seat for the caterer.
- The **caterer and venue need printable outputs:** table-by-table meal counts, escort cards and a floor plan.
- AllSeated (free) and Social Tables (Cvent, venue-grade) own the drag-and-drop floor-plan space ([AllSeated](https://thebudgetsavvybride.com/allseated-wedding-tool/), [Social Tables review](https://meetings.skift.com/cvent-social-tables-review)). **The visual seating map is deferred in the owner's sketch ("Design Studio"), which is correct.** The prototype needs only a **list-based table-assignment view** (table → guests → meal counts).

### 1.6 Wedding-day timeline (run of show)

This is Libretto's schedule/day sheet, nearly one-to-one, but with wedding-specific blocks and resolution to the minute.

| Block | Typical items |
|---|---|
| Getting ready | HMUA arrival (often 4–6 h before the ceremony for a large bridal party), photographer arrival for details shots, first look |
| Vendor arrivals | Florist and rentals load-in, caterer arrival, DJ/band setup and sound check, officiant arrival, coordinator walkthrough |
| Ceremony | Processional order (who walks with whom), readings, vows, unity rituals (arras, lazo), recessional. Usually 20–45 min, and Catholic Mass ceremonies run about 60 min |
| Cocktail hour | Usually 60 min while family photos happen and the room is flipped |
| Reception | Grand entrance, first dance, welcome toast, dinner service, parent dances, toasts, cake cutting, bouquet/garter toss, open dancing, last dance, send-off |
| Load-out | Vendor breakdown, rentals pickup, the venue's hard out-time |

The timeline needs:
- **Per-vendor filtered views**, so the DJ sees only their cues and arrival time.
- **Per-person call times**, for the wedding party and the family members in photos.

### 1.7 The vendor team

The Knot reports couples hire **about 13 vendors** on average, with 89% booking a venue, 88% a photographer and 85% a caterer ([The Knot 2026 RWS via search](https://www.businesswire.com/news/home/20260218045442/en)).

Typical roster:
- Venue, caterer, photographer, videographer, florist, DJ/band, ceremony musicians
- Officiant, HMUA (hair and makeup artist), rentals (tables, linens, lounge), cake/desserts
- Stationery, transportation, lighting/AV, photo booth, planner/coordinator
- Specialty vendors: tent, generator, A/C, restrooms

Each vendor needs:
- A **contract** with a signed date, cancellation terms and an overtime rate.
- A **payment schedule** (Section 1.8), an **arrival/departure time** for the timeline, a **day-of contact** and **meal counts**. Vendor meals are a real line item.
- **COI/insurance** documents, often required by the venue.

### 1.8 Payment schedules: the key financial difference

- **Retainer or deposit at signing.** It is commonly **25–50%** depending on vendor type and is usually **non-refundable**, which is why vendors increasingly call it a "retainer" ([The Yes Girls](https://theyesgirls.com/vendor-deposits-explained-when-couples-actually-pay/); [Thryv](https://www.thryv.com/?p=35771)).
- **Milestone payments** in between. Couples make **3–8 payments per vendor** across planning ([The Yes Girls](https://theyesgirls.com/vendor-deposits-explained-when-couples-actually-pay/)). Venues and caterers commonly split into thirds.
- **Final balance** is most often due **10–14 days before** the wedding, and some vendors require it 30 days out. Nearly all remaining balances land in the last month ([Thryv](https://www.thryv.com/?p=35771)). The **final caterer bill** usually follows the final headcount, about 2–3 weeks out.
- **Typical pattern for seed data:**

| Vendor | Pattern |
|---|---|
| Venue | 50% at signing, 25% at 6 months, 25% at 30 days |
| Caterer | 25–30% at signing, 50% at 60–90 days, balance plus final headcount at 14 days |
| Photographer, DJ, florist | 30–50% retainer, balance at 14–30 days |
| HMUA | 25–50% retainer, balance on the day |
| Planner | Retainer of 30–50% at signing, with installments to the final payment about 30 days out |

These are synthesized ranges, not a single cited table.

- **Service charges.** Caterers and venues often add an **18–22% service charge** and sales tax. It is not a gratuity, and the budget must model it ([tipping guide summary](https://www.herecomestheguide.com/wedding-party-ideas/detail/tip-wedding-vendors)).

### 1.9 Gratuities

Couples spend about **$500–$2,000** on tips in total, roughly 10–15% of vendor costs ([Paperlust 2026](https://paperlust.co/blog/how-much-to-tip-wedding-vendors/); [Here Comes the Guide](https://www.herecomestheguide.com/wedding-party-ideas/detail/tip-wedding-vendors)).

| Vendor | Typical tip |
|---|---|
| Catering staff | 15–20% if not already a service charge in the contract |
| HMUA | 15–20% |
| DJ | 10–15% or $50–200 |
| Photographer / videographer | Optional, $50–200 per shooter |
| Officiant | $50–100, or a $100–500 donation to the church if religious |
| Delivery and setup crews | $10–20 per person |
| Planner | Optional; often a gift or a review instead |

**Product feature:** a **"tip envelope" list.** Each vendor gets an amount, a cash flag and a "who hands it over" field, and the planner usually does the handover. A gratuity is a budget line with estimate and actual like any other.

### 1.10 Legal marriage requirements (PR + FL) (verify before shipping)

**Puerto Rico** (Registro Demográfico, Departamento de Salud):

| Requirement | Detail |
|---|---|
| Medical certificate | Lab tests (VDRL/syphilis, chlamydia, gonorrhea), certified by a physician. Non-residents may present a certificate from their home doctor stating they met the tests required where they live. **The certificate is valid only 10 calendar days after issuance** ([La Concha Resort PDF](https://laconcharesort.com/pdf/Requirements-Destination-Wedding-2.pdf); [CASRAI guide](https://casrai.org/salud/en/guides/medical-certificates-puerto-rico)). |
| Documents | Government photo ID or passport, and an original/certified birth certificate. Divorced applicants need the final divorce decree; widowed applicants need the death certificate **(verify)**. Non-English documents may need translation **(verify)**. |
| Fee | **Non-residents: a $150 Internal Revenue stamp (sello de Rentas Internas)**, plus a sworn non-residency affidavit. The resident fee is lower **(verify the amount)** ([search excerpt citing salud.pr.gov](https://www.salud.pr.gov/CMS/112); [Ley 127 summary](https://mail.topuertorico.org/pdf/Requiements-for-Marriage-Ley-127-EN.pdf)). |
| Witnesses | **Two witnesses, age 21+, with government photo ID** ([search excerpt citing salud.pr.gov / Poder Judicial](https://poderjudicial.pr/Documentos/Educo/temas-legales/matrimonio/Celebracion-de-Matrimonio.pdf)). |
| Process | Visit the Registro Demográfico in person or electronically for orientation. Phone (787) 728-7980 ([topuertorico.org](https://welcome.topuertorico.org/gettingmarried.shtml)). |

**Scheduling trap:** the 10-day medical window means the medical certificate task must be scheduled **relative to the ceremony date**, with no more than 10 days of slack. That is a good example of a date-relative, jurisdiction-aware checklist item that no competitor generates.

**Florida** (county Clerk of Court):

| Requirement | Detail |
|---|---|
| Fee | About **$86**, reduced by **$25 (to about $61)** with a completed premarital course of at least 4 hours, taken by both parties within one year. Some counties' totals differ slightly ([Orange County Clerk](https://myorangeclerk.com/Divisions/Marriages); [Broward Clerk](https://browardclerk.org/Divisions/Marriage)). |
| Waiting period | **Florida residents wait 3 days** unless they take the course. **Non-residents are exempt** ([St. Johns Clerk](https://stjohnsclerk.com/?p=7261)). |
| Validity | **60 days** from issuance, usable anywhere in Florida ([Sarasota Clerk FAQ](https://www.sarasotaclerk.com/Marriage/Marriage-License-FAQs); [FindLaw](https://www.findlaw.com/state/florida-law/florida-marriage-license-requirements.html)). |
| Blood test | None. |
| Officiant | Clergy, judges, or a **Florida notary public** may solemnize. Witnesses are not required by state law **(verify)**. |

**Implication:** a "Legal" checklist pack chosen by jurisdiction (PR resident, PR non-resident, FL resident, FL non-resident). Its tasks are offset from the wedding date: for PR, medical certificate T-10d and license T-7d; for FL, license no earlier than T-60d and no later than T-3d for residents.

### 1.11 Catholic church requirements (common in the PR/FL Hispanic market)

These requirements vary by diocese and parish. Confirm with the parish ([Diocese of Orlando Pre-Cana, Spanish](https://2022.orlandodiocese.org/wp-content/uploads/2023/08/Pre-Cana-Proceso-Spanish-1.pdf); [bodas.net](https://www.bodas.net/articulos/requisitos-para-matrimonio-religioso--c173)).

| Requirement | Detail |
|---|---|
| Notice | Contact the parish **6–12 months** ahead. Many US dioceses require at least 6 months. |
| Documents | A **recently issued baptismal certificate** (often within 6 months), confirmation/communion records, and a **cursillo prematrimonial / Pre-Cana** certificate. |
| Pre-marriage file | Prenuptial investigation interview and "freedom to marry" forms. Banns in some parishes. |
| Outside-parish weddings | Need permission or a letter from the home parish **(verify by diocese)**. |
| Restrictions | Church fees or donations, music restrictions, photographer rules, and Mass versus ceremony-only. |

**Product implication:** a "Catholic ceremony" checklist pack plus a **document tracker** (status per required certificate).

### 1.12 Cultural traditions (PR/FL Hispanic market)

| Tradition | What it is | Product hook |
|---|---|---|
| **Padrinos / madrinas** | Sponsors who often fund or present specific items (arras, lazo, Bible, rosary, kneeling pillows, cake) ([David's Bridal](https://davidsbridal.com/blog/?p=36714); [Spanish Academy](https://www.spanish.academy/blog/15-fascinating-hispanic-wedding-traditions-you-didnt-know-about/)) | A "sponsor" role on guests, linked to the item and to who pays. This feeds the budget as a contribution |
| **Las arras** | 13 gold coins blessed and exchanged, a symbol of provision | Ceremony timeline item and sponsor item |
| **El lazo** | A rosary/cord placed around the couple in a figure eight | Ceremony timeline item and sponsor item |
| **Capias** | PR tradition: ribbons printed with the couple's names and date, pinned on guests as keepsakes ([Puerto Rican customs](https://www.inspiredbride.net/?p=64005)) | Guest favors / stationery line |
| **Muñeca (wedding doll)** | PR tradition: a doll dressed like the bride, displayed at the head table, with capias attached | Decor line |
| **Hora loca / late-night** | Late-night high-energy party set, common in PR/Latin receptions **(general industry knowledge)** | Timeline block and entertainment vendor |

Also design for **bilingual stationery and guest communications**. The UI is English, but guest-facing RSVP text should support Spanish.

### 1.13 Multi-day events and destination weddings

- **Sub-events:** welcome party, rehearsal dinner, ceremony, reception, after-party, farewell brunch. Each has its own guest subset, venue, timeline and budget lines. This is exactly Libretto's "tour with member events" shape, but **inside one wedding**.
- **Room blocks.** A **courtesy block** has no penalty for unbooked rooms. An **attrition block** requires filling a minimum (often about 80%) or paying the shortfall. Typical guidance is to block rooms for **60–80% of out-of-town guests** and to book **6–12 months out** ([Joy glossary](https://withjoy.com/glossary/what-is-hotel-room-block/); [Beach Bride room-block guide](https://beachbride.com/destination-wedding-room-block-guide/)). Courtesy blocks are scarce in PR hotels, which raises attrition risk ([Beach Bride via search](https://beachbride.com/destination-wedding-room-block-guide/)). Libretto's `hotel_rooms` / hospitality already model rooms; Ceremony adds a **pickup vs. committed** count and the attrition deadline.
- **Travel.** Guests' arrival flights feed airport shuttle schedules and welcome-bag delivery.
- **Welcome bags:** an inventory count matched to the room list, delivery by hotel, and contents as budget lines.

### 1.14 Weather and rain plans

- **Atlantic hurricane season runs June 1 – Nov 30**, with the peak in Aug–Oct. That matters for both PR and FL, and is standard NOAA knowledge. Afternoon thunderstorms are near-daily in the FL summer.
- Every outdoor ceremony needs a **Plan B**: a tent hold (with the date by which it must be called), an indoor-space hold, and a "weather call" deadline (often T-48h to T-24h).
- Destination couples should be advised on **wedding insurance and vendor force-majeure clauses**.
- Product: a **rain-plan field per sub-event**, a weather-call task, and alternate-layout notes.

### 1.15 Day-of emergency kit

This is a standard planner checklist and good seed data. Typical contents:
- Sewing kit, safety pins, fashion tape, stain remover, steamer
- Pain reliever, antacid, band-aids, blotting papers
- Phone chargers, scissors, zip ties, a lighter for candles
- Mints, snacks and water for the couple
- Extra copies of the timeline, the vendor contact sheet, and tip envelopes

### 1.16 Planner service levels and pricing

| Service level | Scope | Typical US price |
|---|---|---|
| **Full planning** | Engaged 12–18 months out. Vendor sourcing, design, budget and execution | $3,500–$10,000+. Many charge **10–15% of the total budget** (some up to 20%) |
| **Partial planning** | Engaged 3–6 months out. Fills gaps and coordinates | $1,500–$6,000 |
| **Month-of coordination** | Takes over 4–8 weeks out. Builds the timeline and confirms vendors | $1,500–$4,000 (avg about $2,400) |
| **Day-of coordination** | Executes the plan on the day | $800–$2,500 (avg about $1,600) |

Sources: [Loverly](https://loverly.com/planning/budget/wedding-planner-cost), [Fash.com](https://fash.com/costs/wedding-coordinator-cost), [EventPlanning.com](https://eventplanning.com/how-much-does-wedding-planner-cost/), [Minted](https://www.minted.com/wedding-ideas/wedding-planner-cost).

Pricing models are a **flat package**, a **% of budget**, a **hybrid** (base plus %), or **hourly** for consultations. **Ceremony Pro must support all of them on the planner's invoice to the couple.** A %-of-budget fee is **computed from the wedding's budget total**, a new formula that belongs in the finance module.

---

## 2. Competitor landscape

Prices are current as of searches on **2026-10-07** unless noted. All of them change often.

| Product | Target | Key features | Pricing | Notable gaps / complaints |
|---|---|---|---|---|
| **Aisle Planner** | Pro (wedding planners) | Wedding-specific: timelines, checklists, budget, guest list, seating/floor plans, design boards, client portal, CRM/proposals/invoices | Priced by project count, monthly: **10 projects $39.99 · 25 projects $69.99 · 45 projects $99.99 · 65 projects $129.99 · 100 projects $169.99**, with a 30-day trial ([Capterra](https://www.capterra.com/p/210290/Aisle-Planner/pricing/)) | Small review base (G2 4.3/21 reviews, GetApp 3.5). An April 2026 review reports an ACH payment bug that truncated bank details, with dismissive support ([Capterra](https://www.capterra.com/p/210290/Aisle-Planner/)). Described as covering "the basics" but not deep project management. |
| **HoneyBook** | Pro (any creative/service business) | CRM, proposals, contracts, e-sign, invoices/payments, scheduling, automations, client portal | **$36 / $59 / $129 per month** monthly (Starter/Essentials/Premium), or $29/$49/$109 billed annually, after a **Feb 2025 hike of up to about 89%** ([Agiled](https://agiled.app/blog/honeybook-pricing); [Prospeo](https://prospeo.io/s/honeybook-alternatives)) | **No guest list, RSVP, seating chart or wedding website.** Planners pay for it and still run weddings in spreadsheets ([planning.wedding](https://planning.wedding/honeybook-alternatives)). The price hike is the top complaint. |
| **Dubsado** | Pro (service businesses) | CRM, forms, contracts, invoices, workflows ("Flows"), scheduler, client portal. 3 seats included | **Starter $35/mo, Premier $55/mo** after a **Dec 1, 2025 increase** (from $20/$40) ([OneSuite](https://onesuite.io/blog/dubsado-pricing/); [Agiled](https://agiled.app/blog/dubsado-pricing)) | Steep learning curve. Generic, with no wedding objects. Starter lacks automations and scheduling. |
| **Planning Pod** | Pro (planners and venues) | CRM, BEOs, floor plans, proposals, invoicing, checklists, event websites, **unlimited users** | **Planner $74/mo ($49/mo annual), 10 events. Business $109 (25), Enterprise $159 (50), Venue $149** ([Capterra/search](https://www.capterra.com/p/125947/Planning-Pod/pricing/)) | Broad (restaurants, hotels, venues), so it is not wedding-native. Low event caps per tier. Dated UI per reviews **(verify)**. |
| **Zola** | Couple (DIY), with vendor marketplace | Website, guest list, RSVP, seating chart (PDF export), budget tracker with suggested allocations and payment reminders, registry, vendor marketplace | **Free** for couples. Monetizes through the registry (a 2.5% couple fee on cash funds is reported, though another summary says no fee on the first $10k by bank) and through vendor leads ([Nathan Tailors comparison](https://www.nathantailors.com/en/blog/zola-vs-the-knot-vs-weddingwire-2026); [HBS D3](https://d3.harvard.edu/platform-digit/submission/zola-your-new-favorite-all-things-wedding-platform-is-free-mostly/)) | The couple-side budget is shallow: no real vendor payment schedule and no planner collaboration. Vendor upsell. **(Exact registry fee terms: verify.)** |
| **The Knot** | Couple, plus vendor marketplace | Website, guest list, RSVP, checklist, budgeter, vendor search, registry. Launched a ChatGPT app in 2026 ([TKWW press](https://www.theknotww.com/press-releases/the-knot-worldwide-launches-the-wedding-industrys-first-app-within-chatgpt)) | **Free** for couples. Vendors pay for storefronts, reportedly about **$50–$1,200+/mo by market**, quote-only ([planning.wedding](https://planning.wedding/is-the-knot-worth-it-for-vendors)) | Lead-sale spam after vendor inquiries, **RSVP sync bugs**, registry card fees in fine print, poor support in the final 30 days ([unstar.app](https://unstar.app/blog/zola-the-knot-joy-weddingwire-minted-wedding-planning-apps-ranked-2026)). Reddit claims it removes negative reviews. |
| **WeddingWire** | Couple, plus vendor marketplace (same owner as The Knot) | To-do list, budget planner, guest list, website, vendor directory | **Free** for couples ([WeddingWire tools](https://www.weddingwire.com/tools/Main)). Vendor storefronts are paid. | Same lead-gen model and the same complaints as The Knot. Planning tools are basic. |
| **Joy (withjoy)** | Couple | Website, app, unlimited guests, RSVP, digital save-the-dates and invites, registry, multiple editors, guest photo sharing, travel/maps help | **Free.** Add-ons: custom domain $19.99/yr, SMS, premium stationery. Monetizes through the registry ([Joy pricing](https://withjoy.com/pricing/)) | Guest-experience focused. Weak on budget, vendor payments and planner workflows. |
| **AllSeated** | Couples, planners, venues | To-scale floor plans, seating charts, guest list/RSVP, collaboration with venue and planner | **Free** for couples and planners ([Budget Savvy Bride](https://thebudgetsavvybride.com/allseated-wedding-tool/)). Venue-side enterprise monetization **(verify)**. | Seating and floor-plan only. Not a planning or finance system. |
| **Social Tables (Cvent)** | Venues and hotels, corporate planners | To-scale 2D/3D diagrams, attendee tagging (dietary etc.), collaboration permissions, versioning | Reportedly **from about $199** **(verify; mostly quote-based)** ([Techjockey](https://techjockey.com/detail/social-tables)) | Enterprise/hospitality-grade. Overkill and too expensive for an independent planner or a couple. |
| **Tripleseat** | Venues, restaurants, caterers | Lead-to-booking, BEOs, proposals, contracts, payments, calendar | **Quote only**, and reviewers call it expensive for small operators ([Perfect Venue review](https://www.perfectvenue.com/post/tripleseat-review)) | Venue-side, so not a competitor for planners or couples. A possible **integration** target, since venues send BEOs to planners. |
| *Also relevant:* **WedSites / Appy Couple** | Couple | Website, RSVP, and (WedSites Pro) checklist, seating, timeline, budget | **One-time fees:** WedSites $99 Standard / $199 Pro. Appy Couple $39 / $89 ([WedSites pricing](https://wedsites.com/pricing); [WedSites vs Appy Couple](https://docs.wedsites.com/resources/compare/wedsites-vs-appy-couple)) | They prove couples will pay **one-time** for a premium planning bundle. |

### What the landscape tells us

1. **There are two disconnected worlds.** Planners use a **CRM** (HoneyBook or Dubsado) for contracts and invoices, plus **Aisle Planner or spreadsheets** for the actual wedding. Couples use **free, registry- and lead-funded** tools (Zola, The Knot, Joy). Nobody joins the planner's back office to the couple's front office well.
2. **Wedding finance is shallow everywhere.** Couple tools have budget trackers but no real **vendor payment schedule with due dates, partial payments and gratuities**. Planner CRMs track the planner's own invoices, not the couple's vendor bills. This is Libretto's home turf: estimate vs. actual, fee bearers and category rollups.
3. **Price hikes create switching intent.** HoneyBook (Feb 2025) and Dubsado (Dec 2025) both raised prices sharply, and planners are actively shopping ([Prospeo](https://prospeo.io/s/honeybook-alternatives)).
4. **Couples hate lead-gen.** A DIY product that **does not sell their data to vendors** is a selling point in itself.
5. **None localize for PR/FL Hispanic weddings:** legal packs, Catholic paperwork, padrinos and bilingual guest comms.

---

## 3. Pricing recommendation

### Anchors

| Reference | Price |
|---|---|
| Libretto | $49/mo, 14-day trial |
| Aisle Planner | $39.99 (10 projects) → $69.99 (25) → $99.99 (45) |
| HoneyBook | $36 / $59 / $129 per month |
| Dubsado | $35 / $55 per month |
| Planning Pod | $74/mo (10 events) |
| Couple tools | Free (Zola, Knot, Joy) or one-time $39–$199 (Appy Couple, WedSites) |

### Pro (planners)

| Plan | Price | Limits | Rationale |
|---|---|---|---|
| **Pro Solo** | **$59/mo** ($49/mo billed annually) | 1 seat, **15 active weddings**, client portal, unlimited archived weddings | Sits between Aisle Planner's 10- and 25-project tiers. Matches HoneyBook Essentials, which planners **also** pay for today, so it can replace that subscription. Annual billing matches Libretto's $49 figure. |
| **Pro Studio** | **$99/mo** ($79/mo billed annually) | 3 seats, **unlimited active weddings**, team task assignment, branded portal | Planning firms with associates. Undercuts Aisle Planner's 45-project tier plus HoneyBook. |
| Extra seat | **$15/mo** | Day-of assistants can be free "crew" seats (Libretto already has a free crew role) | This reuses Libretto's seat model (`plans.ts` `seats`, with the crew role as a free seat). |

Further notes on Pro:
- **Meter by active weddings, not total.** A wedding becomes inactive 30–60 days after its date. Planners hate paying for archived projects.
- **Client (couple) portal logins are always free and unlimited.** That is the network effect.
- Make payments **0% markup on processing** (Stripe pass-through), as Dubsado does. Optionally add a small platform fee later.

### DIY (couples)

| Plan | Price | Rationale |
|---|---|---|
| **DIY Free** | $0: budget plus checklist plus up to **50 guests**, no client portal | Needed to compete with free Zola/Knot/Joy. Acts as a funnel. |
| **DIY Complete** | **$79 one-time per wedding**, 24 months of access (extendable for $5/mo after) | A wedding is a single project with a fixed end, so **a subscription feels wrong** to a couple and churns anyway. One-time fees at $39–$199 are proven (Appy Couple, WedSites). $79 is less than 0.25% of a $34k wedding. |
| DIY → Pro hand-off | If the couple hires a Ceremony Pro planner, their wedding (guests, budget, vendors) **transfers into the planner's workspace** | This is a unique growth loop: couples become a referral channel for planners, and vice versa. |

**Avoid** a DIY monthly subscription. If one is required for Stripe simplicity, use $12/mo with a cap equal to the one-time price. **Do not** monetize through registry or vendor leads in v1; "no vendor spam" is a selling point.

All of these prices are recommendations for validation, not tested numbers. They are new SKUs on the existing Stripe lookup-key pattern: `ceremony_pro_solo_monthly`, `ceremony_pro_studio_monthly` and `ceremony_diy_onetime`. The last needs a **one-time Checkout mode**, which Libretto's billing.ts does not do today and which is a code change.

---

## 4. Must-have features for the prototype (ranked)

### Both tiers (shared core)

| # | Feature | Notes / differentiator |
|---|---|---|
| 1 | **Wedding record + dashboard** | Name, date, countdown (days out), venue(s), status, next tasks, latest note. This is the owner's top-grid sketch. |
| 2 | **Budget, estimate vs. actual, by category** | Seeded categories with suggested % allocations (Section 6). Reuses `finance.ts` math. **Differentiator:** real variance, plus service charge and tax lines. |
| 3 | **Vendor list with payment schedule** | Per vendor: contract total, installments (amount, due date, paid date, method), balance due, overdue alerts. **The #1 differentiator; nobody does it well.** |
| 4 | **Checklist from months-out templates** | Tasks have date-relative due dates, assignee (couple / planner / parent) and status. Includes PR/FL legal and Catholic packs (**differentiator**). |
| 5 | **Guest list + households + RSVP + meal choice** | Plus-ones, kids, dietary needs, per-sub-event invitations, A/B list. **Differentiator: a correct headcount** (Knot complaints). |
| 6 | **Day-of timeline** | Minute-level, per sub-event, with vendor arrival times and a per-vendor filtered/printable view. Reuses the Libretto schedule/day sheet. |
| 7 | **Sub-events** | Welcome party, rehearsal, ceremony, reception, after-party. Each has a venue, timeline and guest subset. |
| 8 | **Documents & contracts** | Upload or link a contract per vendor, with a signed-status flag. Also tracks legal documents (license, medical certificate, baptismal certificate). |
| 9 | **Gratuity list** | Tip amount per vendor, a cash flag and the hand-over person. Feeds the budget. |
| 10 | **Notes and rain plan** | Per sub-event Plan B and a weather-call deadline. |

### Pro-only

| # | Feature | Notes |
|---|---|---|
| P1 | **Multi-wedding dashboard** | All active weddings by stage: upcoming payments due across weddings this week, overdue tasks, latest client email. |
| P2 | **Client management (CRM-lite)** | Couples and contributors, an inquiry → booked → active → completed pipeline, and service level (full/partial/month-of/day-of). |
| P3 | **Planner's own fees and invoicing to the client** | Flat, %-of-budget (computed), hybrid; installments; payments received and outstanding. This is the "Financials" menu item. |
| P4 | **Client portal** | The couple views and edits guests, approves budget and vendor items, sees the timeline. The planner controls visibility. |
| P5 | **Team seats + task assignment** | Reuses Libretto's memberships/roles. Crew seats are free day-of assistants. |
| P6 | **Templates** | The planner's own checklist, timeline and vendor templates, reused across weddings. |
| P7 | **Email log** | Per-wedding log of emails sent and received. v1 can be manual or BCC-in. The Libretto CLAUDE.md flags real Gmail/Outlook sync as costly, gen-2 scope. |
| P8 | **Preferred-vendor directory** | Libretto's vendor CRM, reused across weddings, with per-wedding bookings. |

### DIY-only

| # | Feature | Notes |
|---|---|---|
| D1 | **Guided onboarding** | Date, budget, guest estimate and region (PR/FL), producing a seeded budget, checklist and legal pack. |
| D2 | **Contributors** | Parents and padrinos who pay, with "who covers what" and a share of the budget. |
| D3 | **Shared couple access** | Both partners edit. A parent may get limited access. |
| D4 | **Guest-facing RSVP page** | Bilingual EN/ES. Could be a v1.1 item if time-boxed; the guest-list data model must exist from day 1. |
| D5 | **"Hire a planner" hand-off** | The wedding transfers into a Pro workspace. |

### Explicitly deferred

- Visual seating/floor-plan Design Studio (AllSeated is free and good).
- Wedding website builder.
- Registry.
- Two-way Gmail/Outlook sync.
- Vendor marketplace.
- E-signature. Link out to an existing signed PDF in v1.

---

## 5. Data model entities

The table maps each entity to a Libretto concept. "Reuse" means the same table and shape, renamed or with added columns. "Adapt" means the same idea with different semantics. "New" means no Libretto equivalent.

| Entity | Key fields | Libretto mapping |
|---|---|---|
| **account / membership / role** | Same as Libretto. Add `account_kind` (`pro` / `diy`) | **Reuse** `accounts`, `memberships`, `invitations`, `subscriptions` and the paywall RLS pattern |
| **wedding** | `name`, `date`, `status`, `service_level`, `budget_target`, `guest_estimate`, `jurisdiction` (PR_res / PR_nonres / FL_res / FL_nonres / other), `ceremony_type` (civil / Catholic / other), `primary_venue_id` | **Adapt** `events`. The event is still the atomic unit, but a wedding *contains* sub-events, much like a tour contains events. Two options: wedding = `tours`-like parent with `events` as sub-events (fits "no stored totals, always sum children"), or wedding = `events` with a new `sub_events` table. **Recommend wedding as parent and sub_events as children**, mirroring the tour → event rollup. |
| **sub_event** | `wedding_id`, `kind` (welcome / rehearsal / ceremony / cocktail / reception / after_party / brunch), `start_at`, `end_at`, `venue_id`, `rain_plan`, `weather_call_at` | **Reuse** the `events` shape (venue and date) under the wedding |
| **client (couple / contributor)** | `wedding_id`, `name`, `email`, `phone`, `role` (partner / parent / padrino / other), `portal_access`, `language` (en / es) | **New** (Libretto's `people` is staff). Pro CRM pipeline stage lives on the wedding |
| **household** | `wedding_id`, `name` ("The García Family"), `address`, `side`, `list` (A/B), `invite_wave`, `invited_sub_events[]` | **New** |
| **guest** | `household_id`, `first/last`, `is_child`, `plus_one_allowed`, `is_plus_one_of`, `dietary`, `allergies`, `relationship`, `sponsor_role` (padrino/madrina + item), `table_id`, `seat_no` | **New** |
| **rsvp** | `guest_id`, `sub_event_id`, `status` (invited / attending / declined / no_response), `meal_choice_id`, `responded_at`, `notes` | **New**. Per guest per sub-event |
| **meal_option** | `wedding_id`, `sub_event_id`, `name`, `is_kids`, `price_per_head` (optional, links to the caterer line) | **New** |
| **table / seat** | `sub_event_id`, `name/number`, `shape`, `capacity`; seat = (`table_id`, `guest_id`, `seat_no`) | **New** (list view in v1; visual layout deferred) |
| **vendor** | `category`, `company`, `contact`, `email`, `phone`, `instagram/web`, `insurance_doc` | **Reuse** `vendors` (with Google Places sourcing) |
| **vendor_booking** | `wedding_id`, `vendor_id`, `stage` (researching / inquired / proposal / booked / paid / cancelled), `contract_total`, `service_charge_pct`, `tax_pct`, `arrival_at`, `departure_at`, `day_of_contact`, `vendor_meals` | **Reuse** the `vendor_bookings` pipeline |
| **contract / document** | `wedding_id`, `vendor_booking_id?`, `kind` (vendor_contract / marriage_license / medical_cert / baptismal_cert / pre_cana / coi / other), `status` (needed / requested / received / signed / expired), `url`, `signed_at`, `expires_at` | **New**. The "supporting docs links" idea already exists in the sketch |
| **payment_schedule (installment)** | `vendor_booking_id`, `label` (retainer / installment / final), `amount` or `pct`, `due_date` or `due_offset_days`, `paid_at`, `paid_amount`, `method`, `payer_client_id` (who paid: couple / parents) | **New**, and the key one. A booking's installments sum to its contract total. |
| **budget_line** | `wedding_id`, `sub_event_id?`, `category_id`, `vendor_booking_id?`, `estimate_qty`, `estimate_unit_cost`, `actual_qty`, `actual_unit_cost`, `fee_bearer`, `paid_by_client_id` | **Reuse** `expense_lines` exactly (estimate and actual, `qty × unit_cost`). Example: caterer = guests × per-head. Gratuity and service-charge lines are ordinary lines. |
| **budget_category** | `name`, `suggested_pct`, `sort` | **Reuse** `event_categories`, seeded with wedding categories (Section 6) |
| **planner_invoice / payment_received** | `wedding_id`, `client_id`, `fee_model` (flat / pct_of_budget / hybrid / hourly), `amount`, installments, `paid_at` | **Adapt** Libretto income lines. A **%-of-budget fee must be computed in `finance.ts`** from the budget-line totals (a new function, never reimplemented elsewhere) |
| **task (checklist item)** | `wedding_id`, `title`, `due_date` or `due_offset_days`, `assignee` (planner user / client), `status`, `template_id`, `pack` (general / legal_PR / legal_FL / catholic) | **New** (Libretto has no checklist) |
| **checklist_template** | `account_id` (null = system), `items[]` with offsets | **New** |
| **timeline_item** | `sub_event_id`, `start_at`, `duration_min`, `title`, `location`, `owner` (vendor_booking / person), `visible_to[]` | **Reuse** `schedule_items` and the day sheet |
| **room_block** | `wedding_id`, `hotel`, `block_type` (courtesy / attrition), `rooms_committed`, `rooms_picked_up`, `rate`, `cutoff_date`, `attrition_pct` | **Reuse** hospitality `hotel_rooms` / `hotel_fee_lines`, adding pickup and attrition fields |
| **guest_travel** | `guest_id`, `arrival_flight`, `arrival_at`, `hotel_id`, `needs_shuttle` | **Adapt** hospitality flights |
| **email_log** | `wedding_id`, `direction`, `from`, `to`, `subject`, `received_at`, `linked_vendor_booking_id?` | **New** (Libretto has Resend sends only) |
| **note** | `wedding_id`, `pinned`, `body` | **New** (trivial) |

**Invariants to carry over from Libretto:**
- Every budget line keeps **estimate and actual** columns.
- **No stored wedding total**: always sum the lines, just as a tour budget is never stored.
- Every new table gets the **restrictive `subscription_required` RLS policy**.
- Money math stays in **`finance.ts`**.

New finance functions:
- `installmentsBalance()`
- `nextPaymentDue()`
- `plannerFee(pct, budgetTotal)`
- `perHeadLine(guests, rate)`
- `serviceChargeAndTax()`

**Semantic differences that are traps:**
- **There is no ticket revenue.** Libretto's tax-on-ticket-gross and break-even rules do not apply. Do not import `breakEven` for weddings.
- **Fee bearer** keeps a meaning in one place: a planner passes a vendor cost through to the client (client-borne) versus absorbing it (planner-borne).
- **Paid-by** is a new dimension with no Libretto analog: couple versus parents versus padrinos.

---

## 6. Typical numbers (for seed data)

### National (US)

| Metric | Value | Source / confidence |
|---|---|---|
| Average wedding cost (2025 weddings) | **About $34,000–$34,200** | [The Knot 2026 RWS, about 10,474 couples](https://www.businesswire.com/news/home/20260218045442/en) (excerpts cite both $34,000 and $34,200) |
| Prior year (2024 weddings) | $33,000 (cost per guest $284) | [The Knot 2025 RWS via FOX](https://www.foxbusiness.com/lifestyle/wedding-season-here-how-much-one-cost-2025) |
| Zola's 2025 estimate | About $36,000 | [WPTV](https://www.wptv.com/money/consumer/how-much-does-a-wedding-cost-in-florida-in-2025) |
| Average guest count | **117** | The Knot 2026 RWS |
| Cost per guest | **About $292** | The Knot 2026 RWS |
| Vendors hired | **13** (89% venue, 88% photographer, 85% caterer) | The Knot 2026 RWS |
| Engagement length | **About 14 months** | The Knot 2026 RWS |
| Small vs. large (2024 weddings) | Under 50 guests ≈ $15k; over 100 guests ≈ $42k | [The Knot 2025 RWS via FOX](https://www.foxbusiness.com/lifestyle/wedding-season-here-how-much-one-cost-2025) |

### Average vendor spend (The Knot 2026 RWS, 2025 weddings, via [MoneyLion summary](https://moneylion.com/trending/money/wedding-costs-from-knot-study-will-make-you-just-elope))

| Vendor | Average | Notes |
|---|---|---|
| Venue | **$12,900** | About 38% of the average total ([Paperlust](https://paperlust.co/blog/?p=19830)) |
| Catering | **$80/person** | Median $70; range $60–$130. 117 guests × $80 ≈ $9,400 |
| Photographer | **$3,000** | Median $2,800 |
| Florist | **$2,800** | Median $1,900 |
| DJ | **$1,800** | Median $1,600 |
| Planner | Full service $3,500–$10k+; day-of about $1,600 | Section 1.16 |
| Tips (total) | $500–$2,000 | Section 1.9 |

### Florida and Puerto Rico

| Area | Average | Source / confidence |
|---|---|---|
| Florida statewide | **About $34,570** | [WPTV 2025](https://www.wptv.com/money/consumer/how-much-does-a-wedding-cost-in-florida-in-2025) |
| Miami metro | **About $46,100** | Same source; South FL (Miami/Fort Lauderdale/Palm Beach) is the most expensive |
| Tampa | About $37,500 | Same source |
| Orlando | About $25,850 | Same source |
| Puerto Rico | **No reliable published average found** | Destination weddings at PR resorts commonly run on per-guest packages. Treat any PR figure as an assumption: a $25k–$45k range for seed data is a guess, not a statistic. |

### Budget % by category (seed `suggested_pct`)

This synthesizes [WeddingWire](https://www.weddingwire.com/wedding-ideas/wedding-budget-breakdown), [Joy](https://withjoy.com/blog/wedding-budget-breakdown-by-percentage/), [WalletHub](https://wallethub.com/edu/b/wedding-budget-breakdown/152625) and [Giftlist](https://giftlist.com/blog/wedding-budget-breakdown-by-percentage). Industry rules of thumb are 40–50% venue plus catering, 10–12% photo/video, 8–10% flowers/decor, 5–10% entertainment, 5–10% attire/beauty, and 5–10% contingency.

| Category | Suggested % | On $34,000 |
|---|---|---|
| Venue (rental, ceremony site, venue fees) | 30% | $10,200 |
| Catering & bar (food, drink, cake, service charge) | 18% | $6,120 |
| Photography & videography | 11% | $3,740 |
| Flowers & decor (incl. lighting) | 9% | $3,060 |
| Music & entertainment (DJ/band, ceremony musicians) | 7% | $2,380 |
| Attire & beauty (dress, suit, alterations, HMUA) | 7% | $2,380 |
| Planner / coordinator | 6% | $2,040 |
| Rentals (tables, linens, lounge, tent) | 3% | $1,020 |
| Stationery & favors (invites, capias, welcome bags) | 2% | $680 |
| Rings | 2% | $680 (often excluded; engagement ring is never in the budget) |
| Transportation | 1% | $340 |
| Officiant, license & ceremony fees (incl. church donation) | 1% | $340 |
| Gratuities | 3% | $1,020 |
| **Total** | **100%** | **$34,000** |

Two notes on the table:
- It is synthesized: the venue share is anchored to The Knot's $12.9k (about 38% of the total if the venue includes in-house catering). Seed venue and catering together at about 48%, consistent with the 40–50% rule.
- Add a separate **Contingency 5–10%** as an *unallocated buffer* (target × 5–10% held back) rather than a category.

### Payment schedule pattern (seed installments)

Pattern: **retainer at signing → milestone(s) → final balance due T-14d (T-30d for venue/planner)**.

| Vendor | Installments (pct @ offset from wedding date) |
|---|---|
| Venue | 50% @ signing · 25% @ T-180d · 25% @ T-30d |
| Caterer | 30% @ signing · 40% @ T-90d · 30% @ T-14d (after final headcount, plus service charge and tax) |
| Photographer / Videographer | 40% @ signing · 60% @ T-14d |
| Florist | 30% @ signing · 70% @ T-14d |
| DJ / Band | 50% @ signing · 50% @ T-14d |
| HMUA | 30% @ signing · 70% @ day-of |
| Rentals | 50% @ signing · 50% @ T-14d |
| Planner (full service) | 40% @ signing · 30% @ T-180d · 30% @ T-30d |
| Cake | 50% @ signing · 50% @ T-14d |

Seed rule of thumb: **deposits 25–50%, 3–8 payments per vendor, and nearly everything due in the last 30 days**. The Pro dashboard's "payments due this week across all weddings" view therefore spikes about 2–4 weeks before each wedding.

---

## Sources

The main sources are cited inline. Key ones:

**Market statistics**
- The Knot 2026 Real Weddings Study ([BusinessWire](https://www.businesswire.com/news/home/20260218045442/en), [MoneyLion summary](https://moneylion.com/trending/money/wedding-costs-from-knot-study-will-make-you-just-elope))
- The Knot 2025 RWS ([FOX Business](https://www.foxbusiness.com/lifestyle/wedding-season-here-how-much-one-cost-2025))
- Florida costs ([WPTV](https://www.wptv.com/money/consumer/how-much-does-a-wedding-cost-in-florida-in-2025))

**Competitor pricing**
- Aisle Planner ([Capterra](https://www.capterra.com/p/210290/Aisle-Planner/pricing/))
- HoneyBook ([Agiled](https://agiled.app/blog/honeybook-pricing))
- Dubsado ([OneSuite](https://onesuite.io/blog/dubsado-pricing/))
- Planning Pod ([Capterra](https://www.capterra.com/p/125947/Planning-Pod/pricing/))
- Joy ([withjoy.com/pricing](https://withjoy.com/pricing/))
- WedSites ([wedsites.com/pricing](https://wedsites.com/pricing))

**Legal requirements**
- Puerto Rico ([La Concha Resort requirements PDF](https://laconcharesort.com/pdf/Requirements-Destination-Wedding-2.pdf), [Poder Judicial PR](https://poderjudicial.pr/Documentos/Educo/temas-legales/matrimonio/Celebracion-de-Matrimonio.pdf))
- Florida ([Orange County Clerk](https://myorangeclerk.com/Divisions/Marriages), [Sarasota Clerk FAQ](https://www.sarasotaclerk.com/Marriage/Marriage-License-FAQs))
